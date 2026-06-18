import { UnauthorizedException } from '@nestjs/common';
import { User } from '@/modules/users/domain/entities/user.entity';
import { IUserRepository } from '@/modules/users/domain/repositories/user.repository.interface';
import { PasswordService } from '../../domain/services/password.service';
import { TokenService } from '../../infrastructure/services/token.service';
import { LoginUseCase } from './login.use-case';

function makeUser(overrides: Partial<User> = {}): User {
  return new User({
    id: 'user_1',
    email: 'demo@example.com',
    passwordHash: 'hashed-pw',
    name: 'María Demo',
    avatar: null,
    emailVerified: null,
    isDemo: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildUserRepo(): jest.Mocked<IUserRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function buildPasswordService(): jest.Mocked<PasswordService> {
  return {
    hash: jest.fn(),
    compare: jest.fn(),
  } as unknown as jest.Mocked<PasswordService>;
}

function buildTokenService() {
  return {
    generateAccessToken: jest.fn().mockResolvedValue('access.token'),
    generateRefreshToken: jest.fn().mockResolvedValue('refresh.token'),
    saveRefreshToken: jest.fn().mockResolvedValue(undefined),
  } as unknown as TokenService;
}

describe('LoginUseCase', () => {
  it('throws 401 when the email does not match any user', async () => {
    const users = buildUserRepo();
    const pwd = buildPasswordService();
    const tokens = buildTokenService();
    users.findByEmail.mockResolvedValue(null);

    const useCase = new LoginUseCase(users, pwd, tokens);

    await expect(useCase.execute({ email: 'nobody@example.com', password: 'x' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(pwd.compare).not.toHaveBeenCalled();
  });

  it('throws 401 when the user has no passwordHash (OAuth-only account)', async () => {
    const users = buildUserRepo();
    const pwd = buildPasswordService();
    const tokens = buildTokenService();
    users.findByEmail.mockResolvedValue(makeUser({ passwordHash: null as unknown as string }));

    const useCase = new LoginUseCase(users, pwd, tokens);

    await expect(useCase.execute({ email: 'demo@example.com', password: 'x' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(pwd.compare).not.toHaveBeenCalled();
  });

  it('throws 401 when the password does not match the stored hash', async () => {
    const users = buildUserRepo();
    const pwd = buildPasswordService();
    const tokens = buildTokenService();
    users.findByEmail.mockResolvedValue(makeUser());
    pwd.compare.mockResolvedValue(false);

    const useCase = new LoginUseCase(users, pwd, tokens);

    await expect(useCase.execute({ email: 'demo@example.com', password: 'wrong' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns tokens + user when credentials are valid, and persists the refresh token', async () => {
    const users = buildUserRepo();
    const pwd = buildPasswordService();
    const tokens = buildTokenService();
    users.findByEmail.mockResolvedValue(makeUser());
    pwd.compare.mockResolvedValue(true);

    const useCase = new LoginUseCase(users, pwd, tokens);
    const result = await useCase.execute({ email: 'demo@example.com', password: 'password123' });

    expect(result).toEqual({
      accessToken: 'access.token',
      refreshToken: 'refresh.token',
      user: { id: 'user_1', email: 'demo@example.com', name: 'María Demo' },
    });
    expect(tokens.saveRefreshToken).toHaveBeenCalledWith('user_1', 'refresh.token');
  });

  it('compares the plaintext password against the stored hash exactly (no leak)', async () => {
    const users = buildUserRepo();
    const pwd = buildPasswordService();
    const tokens = buildTokenService();
    users.findByEmail.mockResolvedValue(makeUser({ passwordHash: 'stored-hash' }));
    pwd.compare.mockResolvedValue(true);

    const useCase = new LoginUseCase(users, pwd, tokens);
    await useCase.execute({ email: 'demo@example.com', password: 'plaintext-pw' });

    expect(pwd.compare).toHaveBeenCalledWith('plaintext-pw', 'stored-hash');
  });
});
