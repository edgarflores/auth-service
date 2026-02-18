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

  async login(authCredentialsDto) {
    const { email, password } = authCredentialsDto;

    const userInfo = await this.userRepository.findOne({
      where: { email },
    });

    if (!userInfo) {
      throw new UnauthorizedException('Invalid credentials!!');
    }

    if (!(await bcrypt.compare(password, userInfo.password))) {
      throw new UnauthorizedException('Invalid credentials!!');
    }

    return this.getTokens(userInfo.id);
  }

  private async getTokens(userId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: '15m' },
    );

    const refreshToken = crypto.randomUUID();
    const refreshHash = await bcrypt.hash(refreshToken, 10);

    await this.refreshTokenRepository.save({
      userId,
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

    return this.getTokens(userId);
  }

  async logout(userId: string) {
    await this.refreshTokenRepository.delete({ userId });
    return { message: 'Logged out successfully' };
  }

  async validateToken(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'isActive'],
    });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      userId: user.id,
      email: user.email,
      isActive: user.isActive,
    };
  }
}
