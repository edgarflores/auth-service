import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenEntity } from './entities/refresh-tokens.entity';
import { IJwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  logger = new Logger('AuthService');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,

    private readonly jwtService: JwtService,
  ) {}

  private async loadUserWithRolesAndApps(
    where: { id?: string; email?: string },
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where,
      relations: [
        'userRoles',
        'userRoles.role',
        'userRoles.role.roleApps',
        'userRoles.role.roleApps.app',
      ],
    });
  }

  private extractRolesAndApps(user: User): { roles: string[]; apps: string[] } {
    const roles = new Set<string>();
    const apps = new Set<string>();

    for (const ur of user.userRoles ?? []) {
      if (ur.role) {
        roles.add(ur.role.name);
        for (const ra of ur.role.roleApps ?? []) {
          if (ra.app) apps.add(ra.app.code);
        }
      }
    }

    return {
      roles: Array.from(roles),
      apps: Array.from(apps),
    };
  }

  async login(authCredentialsDto: AuthCredentialsDto) {
    const { email, password } = authCredentialsDto;

    const user = await this.loadUserWithRolesAndApps({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials!!');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials!!');
    }

    return this.getTokens(user);
  }

  private async getTokens(user: User) {
    const { roles, apps } = this.extractRolesAndApps(user);

    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      isActive: user.isActive,
      roles,
      apps,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    const refreshToken = crypto.randomUUID();
    const refreshHash = await bcrypt.hash(refreshToken, 10);

    await this.refreshTokenRepository.save({
      userId: user.id,
      tokenHash: refreshHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { email, password } = authCredentialsDto;
    this.logger.debug(email, password);

    if (!email || !password)
      throw new InternalServerErrorException(
        'email and password can not be empty!',
      );

    const salt = await bcrypt.genSalt();

    const passwordHashed = await bcrypt.hash(password, salt);

    const newUser = this.userRepository.create({
      email,
      password: passwordHashed,
    });

    try {
      await this.userRepository.save(newUser);
    } catch (error) {
      if (error.code === '23505') {
        throw new InternalServerErrorException(
          `Email ${email} already exists!!`,
        );
      }

      throw new InternalServerErrorException(
        'Error saving data. Please contact system admin!',
      );
    }
  }

  async refresh(userId: string, refreshToken: string) {
    const tokens = await this.refreshTokenRepository.find({
      where: { userId },
    });

    let validToken: RefreshTokenEntity | null = null;
    for (const t of tokens) {
      const match = await bcrypt.compare(refreshToken, t.tokenHash);
      const notExpired = new Date() < t.expiresAt;
      if (match && notExpired) {
        validToken = t;
        break;
      }
    }

    if (!validToken)
      throw new UnauthorizedException('Refresh token invalid or expired');

    // Rotation: revoke old token
    await this.refreshTokenRepository.delete({ id: validToken.id });

    const user = await this.loadUserWithRolesAndApps({ id: userId });
    if (!user) throw new UnauthorizedException('User not found');

    return this.getTokens(user);
  }

  async logout(userId: string) {
    await this.refreshTokenRepository.delete({ userId });
    return { message: 'Logged out successfully' };
  }

  validateToken(payload: {
    userId: string;
    email: string;
    isActive: boolean;
    roles: string[];
    apps: string[];
  }) {
    return {
      userId: payload.userId,
      email: payload.email,
      isActive: payload.isActive,
      roles: payload.roles,
      apps: payload.apps,
    };
  }
}
