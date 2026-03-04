/**
 * Value Object para contraseña hasheada. Inmutable.
 */
export class PasswordHash {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): PasswordHash {
    if (!value || value.length < 10) {
      throw new Error('Invalid password hash');
    }
    return new PasswordHash(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: PasswordHash): boolean {
    return this._value === other._value;
  }
}
