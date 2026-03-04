import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { PasswordService } from '../../domain/services/password.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('El enlace de recuperación es inválido o ha expirado');
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return { message: 'Tu contraseña ha sido actualizada exitosamente' };
  }
}
