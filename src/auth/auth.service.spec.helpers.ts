import { User } from './entities/user.entity';

export const mockBcryptCompare = jest.fn();
export const mockBcryptHash = jest.fn();
export const mockBcryptGenSalt = jest.fn();

export const mockUser: Partial<User> = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
  password: 'hashedPassword',
  isActive: true,
  userRoles: [],
};

export function resetBcryptMocks() {
  mockBcryptCompare.mockResolvedValue(true);
  mockBcryptHash.mockResolvedValue('hashedToken');
  mockBcryptGenSalt.mockResolvedValue('salt');
}
