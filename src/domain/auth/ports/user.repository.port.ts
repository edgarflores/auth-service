import { User } from '../user.entity';

/**
 * Port (driven): contrato para persistencia de User.
 * Implementado por adapters en infrastructure.
 */
export const USER_REPOSITORY = Symbol('IUserRepository');

export interface IUserRepository {
  findById(id: string): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  save(user: { email: string; passwordHash: string }): Promise<User>;
}
