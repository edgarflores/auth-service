import { Test, TestingModule } from '@nestjs/testing';
import { RegisterHandler } from './register.handler';
import { USER_REPOSITORY } from '../../../domain/auth/ports/user.repository.port';
import { PASSWORD_HASHER } from '../../../domain/auth/ports/password-hasher.port';
import { EmailAlreadyExistsError } from '../../../domain/auth/errors/auth-domain.errors';
import { RegisterCommand } from './register.command';

describe('RegisterHandler', () => {
  let handler: RegisterHandler;
  let userRepository: { findByEmail: jest.Mock; save: jest.Mock };
  let passwordHasher: { hash: jest.Mock };

  beforeEach(async () => {
    userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue({}),
    };
    passwordHasher = { hash: jest.fn().mockResolvedValue('hashedPassword') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterHandler,
        { provide: USER_REPOSITORY, useValue: userRepository },
        { provide: PASSWORD_HASHER, useValue: passwordHasher },
      ],
    }).compile();

    handler = module.get<RegisterHandler>(RegisterHandler);
  });

  it('debe guardar usuario con datos válidos', async () => {
    await handler.execute(
      new RegisterCommand('newuser@example.com', 'password123'),
    );

    expect(userRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
    expect(passwordHasher.hash).toHaveBeenCalledWith('password123');
    expect(userRepository.save).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      passwordHash: 'hashedPassword',
    });
  });

  it('debe lanzar EmailAlreadyExistsError cuando el email ya existe', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 'existing-id' });

    await expect(
      handler.execute(new RegisterCommand('existing@example.com', 'password123')),
    ).rejects.toThrow(EmailAlreadyExistsError);
  });
});
