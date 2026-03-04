import { PasswordHash } from './value-objects/password-hash.vo';

/**
 * Entidad de dominio User. Aggregate root.
 * Sin dependencias de TypeORM ni infraestructura.
 * Igualdad por id.
 */
export interface UserProps {
  id: string;
  email: string;
  passwordHash: PasswordHash;
  isActive: boolean;
  roles?: string[];
  apps?: string[];
}

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    private readonly passwordHash: PasswordHash,
    public readonly isActive: boolean,
    public readonly roles: string[],
    public readonly apps: string[],
  ) {}

  static create(props: UserProps): User {
    return new User(
      props.id,
      props.email,
      props.passwordHash,
      props.isActive,
      props.roles ?? [],
      props.apps ?? [],
    );
  }

  hasValidPassword(plainPassword: string, compareFn: (plain: string, hash: string) => Promise<boolean>): Promise<boolean> {
    return compareFn(plainPassword, this.passwordHash.value);
  }

  getPasswordHashValue(): string {
    return this.passwordHash.value;
  }

  equals(other: User): boolean {
    return this.id === other.id;
  }

  toTokenPayload(): { sub: string; email: string; isActive: boolean; roles: string[]; apps: string[] } {
    return {
      sub: this.id,
      email: this.email,
      isActive: this.isActive,
      roles: this.roles,
      apps: this.apps,
    };
  }
}
