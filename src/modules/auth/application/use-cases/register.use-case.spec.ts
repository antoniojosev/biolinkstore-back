import { ConflictException } from '@nestjs/common';
import { User } from '@/modules/users/domain/entities/user.entity';
import { IUserRepository } from '@/modules/users/domain/repositories/user.repository.interface';
import { ILandingVisitorRepository } from '@/modules/landing-analytics/domain/repositories/landing-visitor.repository.interface';
import { PasswordService } from '../../domain/services/password.service';
import { TokenService } from '../../infrastructure/services/token.service';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { RegisterUseCase } from './register.use-case';

function makeUser(overrides: Partial<User> = {}): User {
  return new User({
    id: 'user_new',
    email: 'new@example.com',
    passwordHash: 'hashed-pw',
    name: 'Nuevo Usuario',
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

function buildLandingRepo() {
  return {
    linkToUser: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ILandingVisitorRepository>;
}

function buildPasswordService() {
  return {
    hash: jest.fn().mockResolvedValue('hashed-pw'),
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

const prismaStub = {} as PrismaService;

describe('RegisterUseCase', () => {
  it('throws 409 when the email is already taken', async () => {
    const users = buildUserRepo();
    const landing = buildLandingRepo();
    const pwd = buildPasswordService();
    const tokens = buildTokenService();
    users.findByEmail.mockResolvedValue(makeUser({ email: 'taken@example.com' }));

    const useCase = new RegisterUseCase(users, landing, pwd, tokens, prismaStub);

    await expect(
      useCase.execute({ email: 'taken@example.com', password: 'x', name: 'Foo' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(users.create).not.toHaveBeenCalled();
    expect(pwd.hash).not.toHaveBeenCalled();
  });

  it('hashes the password before persisting (never stores plaintext)', async () => {
    const users = buildUserRepo();
    const landing = buildLandingRepo();
    const pwd = buildPasswordService();
    const tokens = buildTokenService();
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue(makeUser());

    const useCase = new RegisterUseCase(users, landing, pwd, tokens, prismaStub);
    await useCase.execute({ email: 'new@example.com', password: 'plaintext-pw', name: 'New' });

    expect(pwd.hash).toHaveBeenCalledWith('plaintext-pw');
    const createCall = users.create.mock.calls[0][0];
    expect(createCall.passwordHash).toBe('hashed-pw');
    expect(JSON.stringify(createCall)).not.toContain('plaintext-pw');
  });

  it('issues access + refresh tokens and persists the refresh side', async () => {
    const users = buildUserRepo();
    const landing = buildLandingRepo();
    const pwd = buildPasswordService();
    const tokens = buildTokenService();
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue(makeUser({ id: 'u_persisted' }));

    const useCase = new RegisterUseCase(users, landing, pwd, tokens, prismaStub);
    const result = await useCase.execute({ email: 'new@example.com', password: 'pw', name: 'New' });

    expect(result).toEqual({
      accessToken: 'access.token',
      refreshToken: 'refresh.token',
      user: { id: 'u_persisted', email: 'new@example.com', name: 'Nuevo Usuario' },
    });
    expect(tokens.saveRefreshToken).toHaveBeenCalledWith('u_persisted', 'refresh.token');
  });

  it('parses dateOfBirth into a Date when provided', async () => {
    const users = buildUserRepo();
    const landing = buildLandingRepo();
    const pwd = buildPasswordService();
    const tokens = buildTokenService();
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue(makeUser());

    const useCase = new RegisterUseCase(users, landing, pwd, tokens, prismaStub);
    await useCase.execute({
      email: 'new@example.com',
      password: 'pw',
      name: 'New',
      dateOfBirth: '1999-04-29',
    });

    expect(users.create.mock.calls[0][0].dateOfBirth).toBeInstanceOf(Date);
    expect((users.create.mock.calls[0][0].dateOfBirth as Date).getUTCFullYear()).toBe(1999);
  });

  it('links the landing fingerprint to the new user when fingerprint is provided', async () => {
    const users = buildUserRepo();
    const landing = buildLandingRepo();
    const pwd = buildPasswordService();
    const tokens = buildTokenService();
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue(makeUser({ id: 'u_persisted' }));

    const useCase = new RegisterUseCase(users, landing, pwd, tokens, prismaStub);
    await useCase.execute({
      email: 'new@example.com',
      password: 'pw',
      name: 'New',
      fingerprint: 'fp-abc123',
    });

    expect(landing.linkToUser).toHaveBeenCalledWith('fp-abc123', 'u_persisted');
  });

  it('does not break registration when landing link fails (fire-and-forget swallow)', async () => {
    const users = buildUserRepo();
    const landing = buildLandingRepo();
    const pwd = buildPasswordService();
    const tokens = buildTokenService();
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue(makeUser());
    landing.linkToUser.mockRejectedValue(new Error('db blew up'));

    const useCase = new RegisterUseCase(users, landing, pwd, tokens, prismaStub);

    await expect(
      useCase.execute({ email: 'new@example.com', password: 'pw', name: 'New', fingerprint: 'fp' }),
    ).resolves.toMatchObject({ accessToken: 'access.token' });
  });
});
