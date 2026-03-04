/**
 * Port (driven): contrato para hashing de contraseñas.
 * Implementado por BcryptPasswordHasher en infrastructure.
 */
export const PASSWORD_HASHER = Symbol('IPasswordHasher');

export interface IPasswordHasher {
  hash(plainPassword: string): Promise<string>;

  compare(plainPassword: string, hash: string): Promise<boolean>;
}
