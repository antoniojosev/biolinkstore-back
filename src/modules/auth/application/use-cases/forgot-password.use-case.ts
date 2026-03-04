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
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      background: linear-gradient(135deg, #0a0f14 0%, #111820 100%); 
      color: #e2e8f0; 
      line-height: 1.6; 
      min-height: 100vh;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 60px 20px; 
    }
    .card { 
      background: rgba(17, 24, 32, 0.8); 
      border: 1px solid rgba(51, 179, 128, 0.2); 
      border-radius: 24px; 
      padding: 48px 40px;
      backdrop-filter: blur(20px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .logo { 
      text-align: center; 
      margin-bottom: 32px; 
    }
    .logo h1 { 
      font-size: 32px; 
      font-weight: 800; 
      background: linear-gradient(135deg, #33b380 0%, #6ee490 100%); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }
    .logo-icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #33b380 0%, #2a9669 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 28px;
    }
    h2 { 
      font-size: 28px; 
      font-weight: 700; 
      margin-bottom: 16px; 
      text-align: center; 
      color: #ffffff;
    }
    .subtitle {
      text-align: center;
      color: #94a3b8;
      margin-bottom: 32px;
      font-size: 16px;
    }
    p { 
      color: #cbd5e1; 
      margin-bottom: 16px; 
    }
    .highlight {
      color: #33b380;
      font-weight: 600;
    }
    .button-wrapper {
      text-align: center;
      margin: 32px 0;
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #33b380 0%, #2a9669 100%); 
      color: #ffffff; 
      text-decoration: none; 
      padding: 16px 40px; 
      border-radius: 12px; 
      font-weight: 600; 
      font-size: 16px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(51, 179, 128, 0.4);
      transition: all 0.3s ease;
    }
    .button:hover { 
      background: linear-gradient(135deg, #2a9669 0%, #228055 100%);
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(51, 179, 128, 0.5);
    }
    .link-text { 
      word-break: break-all; 
      font-size: 13px; 
      color: #64748b; 
      margin-top: 24px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
    }
    .warning { 
      background: rgba(251, 191, 36, 0.1); 
      border: 1px solid rgba(251, 191, 36, 0.2); 
      border-radius: 12px; 
      padding: 20px; 
      margin: 24px 0; 
      font-size: 14px; 
      text-align: center;
    }
    .warning p { 
      margin: 0; 
      color: #fbbf24; 
    }
    .footer { 
      text-align: center; 
      margin-top: 32px; 
      padding-top: 24px; 
      border-top: 1px solid rgba(255,255,255,0.1); 
    }
    .footer p { 
      font-size: 13px; 
      color: #64748b; 
      margin: 0; 
    }
    .footer a {
      color: #33b380;
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(51, 179, 128, 0.3), transparent);
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <div class="logo-icon">🛒</div>
        <h1>Bio Link Store</h1>
      </div>
      
      <h2>¿Olvidaste tu contraseña?</h2>
      <p class="subtitle">Tranquilo, te ayudamos a recuperarla</p>
      
      <p>Hola <span class="highlight">${name}</span>,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Bio Link Store</strong>.</p>
      
      <div class="button-wrapper">
        <a href="${resetUrl}" class="button">Restablecer mi contraseña</a>
      </div>
      
      <div class="warning">
        <p>⏰ Este enlace expira en 1 hora</p>
      </div>
      
      <div class="divider"></div>
      
      <p class="link-text">
        <strong>¿El botón no funciona?</strong><br>
        Copia y pega este enlace en tu navegador:<br>
        ${resetUrl}
      </p>
      
      <div class="footer">
        <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
        <p style="margin-top: 12px;">© 2026 <strong>Bio Link Store</strong>. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
