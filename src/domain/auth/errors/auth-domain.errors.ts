/**
 * Errores de dominio para el contexto de autenticación.
 * Sin dependencias externas.
 */
export class InvalidCredentialsError extends Error {
  constructor(message = 'Invalid credentials') {
    super(message);
    this.name = 'InvalidCredentialsError';
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
    this.name = 'UserNotFoundError';
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class EmailAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Email ${email} already exists`);
    this.name = 'EmailAlreadyExistsError';
    Object.setPrototypeOf(this, EmailAlreadyExistsError.prototype);
  }
}

export class RefreshTokenInvalidError extends Error {
  constructor(message = 'Refresh token invalid or expired') {
    super(message);
    this.name = 'RefreshTokenInvalidError';
    Object.setPrototypeOf(this, RefreshTokenInvalidError.prototype);
  }
}
