import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../infrastructure/services/token.service';
import { RefreshTokenUseCase } from './refresh-token.use-case';

function buildTokenService() {
  return {
    verifyRefreshToken: jest.fn(),
    validateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
    generateAccessToken: jest.fn().mockResolvedValue('new.access.token'),
    generateRefreshToken: jest.fn().mockResolvedValue('new.refresh.token'),
    saveRefreshToken: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<TokenService>;
}

describe('RefreshTokenUseCase', () => {
  it('rejects when the refresh token fails JWT verification', async () => {
    const tokens = buildTokenService();
    tokens.verifyRefreshToken.mockResolvedValue(null);

    const useCase = new RefreshTokenUseCase(tokens);

    await expect(useCase.execute({ refreshToken: 'tampered' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(tokens.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it('rejects when the token is signed but absent from the DB (revoked / unknown)', async () => {
    const tokens = buildTokenService();
    tokens.verifyRefreshToken.mockResolvedValue({ userId: 'u1', email: 'demo@example.com' });
    tokens.validateRefreshToken.mockResolvedValue(false);

    const useCase = new RefreshTokenUseCase(tokens);

    await expect(useCase.execute({ refreshToken: 'revoked' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(tokens.revokeRefreshToken).not.toHaveBeenCalled();
  });

  it('rotates: revokes the old token before saving the new one (no concurrent valid tokens)', async () => {
    const tokens = buildTokenService();
    tokens.verifyRefreshToken.mockResolvedValue({ userId: 'u1', email: 'demo@example.com' });
    tokens.validateRefreshToken.mockResolvedValue(true);

    const useCase = new RefreshTokenUseCase(tokens);
    await useCase.execute({ refreshToken: 'old.refresh' });

    const revokeOrder = (tokens.revokeRefreshToken as jest.Mock).mock.invocationCallOrder[0];
    const saveOrder = (tokens.saveRefreshToken as jest.Mock).mock.invocationCallOrder[0];
    expect(revokeOrder).toBeLessThan(saveOrder);
    expect(tokens.revokeRefreshToken).toHaveBeenCalledWith('old.refresh');
    expect(tokens.saveRefreshToken).toHaveBeenCalledWith('u1', 'new.refresh.token');
  });

  it('returns a fresh access + refresh pair from the verified payload', async () => {
    const tokens = buildTokenService();
    tokens.verifyRefreshToken.mockResolvedValue({ userId: 'u1', email: 'demo@example.com' });
    tokens.validateRefreshToken.mockResolvedValue(true);

    const useCase = new RefreshTokenUseCase(tokens);
    const result = await useCase.execute({ refreshToken: 'old.refresh' });

    expect(result).toEqual({
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    });
    expect(tokens.generateAccessToken).toHaveBeenCalledWith('u1', 'demo@example.com');
    expect(tokens.generateRefreshToken).toHaveBeenCalledWith('u1', 'demo@example.com');
  });
});
