import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../../infrastructure/services/token.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';

@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly tokenService: TokenService) {}

  async execute(dto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token exists in database
    const isValid = await this.tokenService.validateRefreshToken(dto.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    // Revoke old refresh token
    await this.tokenService.revokeRefreshToken(dto.refreshToken);

    // Generate new tokens
    const accessToken = await this.tokenService.generateAccessToken(
      payload.userId,
      payload.email,
    );
    const refreshToken = await this.tokenService.generateRefreshToken(payload.userId);

    // Save new refresh token
    await this.tokenService.saveRefreshToken(payload.userId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }
}
