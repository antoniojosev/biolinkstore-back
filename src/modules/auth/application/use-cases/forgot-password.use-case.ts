import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { EmailService } from '@/modules/email/email.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return {
        message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña',
      };
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Esta cuenta usa autenticación con Google');
    }

    const resetToken = crypto.randomUUID();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const html = this.getResetPasswordEmailHtml(user.name || 'Usuario', resetUrl);

    await this.emailService.sendEmail(dto.email, 'Recupera tu contraseña - Bio Link Store', html);

    return { message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' };
  }

  private getResetPasswordEmailHtml(name: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupera tu contraseña</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0f14; color: #ffffff; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: linear-gradient(145deg, #111920 0%, #0a0f14 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 40px; }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { font-size: 28px; font-weight: 700; background: linear-gradient(135deg, #33b380 0%, #6ee490 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    h2 { font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center; }
    p { color: rgba(255,255,255,0.7); margin-bottom: 20px; }
    .button { display: inline-block; background: linear-gradient(135deg, #33b380 0%, #2a9669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-align: center; }
    .button:hover { background: linear-gradient(135deg, #2a9669 0%, #228055 100%); }
    .link-text { word-break: break-all; font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
    .footer p { font-size: 12px; color: rgba(255,255,255,0.4); margin: 0; }
    .warning { background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; }
    .warning p { margin: 0; color: #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <h1>Bio Link Store</h1>
      </div>
      <h2>¿Olvidaste tu contraseña?</h2>
      <p>Hola <strong>${name}</strong>,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Bio Link Store.</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Restablecer mi contraseña</a>
      </p>
      <div class="warning">
        <p>Este enlace expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este email.</p>
      </div>
      <p class="link-text">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${resetUrl}</p>
      <div class="footer">
        <p>© 2026 Bio Link Store. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
