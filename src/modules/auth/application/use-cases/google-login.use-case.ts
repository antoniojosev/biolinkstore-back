import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { TokenService } from '../../infrastructure/services/token.service';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class GoogleLoginUseCase {
  constructor(private readonly tokenService: TokenService) {}

  async execute(user: User): Promise<AuthResponseDto> {
    const accessToken = await this.tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id, user.email);

    await this.tokenService.saveRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
