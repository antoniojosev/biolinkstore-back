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
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupera tu contraseña — Bio Link Store</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0f14;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="background-color:#0d1218;border:1px solid #1e3a30;border-radius:20px;padding:48px 40px;">

              <!-- Logo -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <div style="display:inline-block;background-color:#33b380;border-radius:14px;width:52px;height:52px;text-align:center;line-height:52px;font-size:26px;">
                      🔗
                    </div>
                    <div style="margin-top:12px;font-size:22px;font-weight:800;color:#33b380;letter-spacing:-0.3px;">
                      Bio Link Store
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:1px;background-color:#1a2e28;padding-bottom:32px;"></td>
                </tr>
              </table>

              <!-- Heading -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:8px;">
                    <p style="margin:0;font-size:26px;font-weight:700;color:#ffffff;text-align:center;">
                      Recuperá tu contraseña
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;color:#6b8a80;text-align:center;">
                      Te ayudamos a volver a tu cuenta
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Body text -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:12px;">
                    <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.7;">
                      Hola <strong style="color:#33b380;">${name}</strong>,
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;color:#94a3b8;line-height:1.7;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé clic en el botón de abajo para crear una nueva.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <a href="${resetUrl}" style="display:inline-block;background-color:#33b380;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.1px;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#1a1500;border:1px solid #3d2e00;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
                    <p style="margin:0;font-size:13px;color:#d4a017;text-align:center;">
                      ⏱ Este enlace expira en <strong>1 hora</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:1px;background-color:#1a2e28;padding:24px 0;"></td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#4a6a5e;">
                      ¿El botón no funciona? Copiá y pegá este enlace en tu navegador:
                    </p>
                    <p style="margin:0;font-size:12px;color:#4a6a5e;word-break:break-all;background-color:#091018;border-radius:8px;padding:12px 14px;">
                      ${resetUrl}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #1a2e28;padding-top:24px;">
                    <p style="margin:0 0 6px;font-size:12px;color:#3d5c52;text-align:center;">
                      Si no solicitaste este cambio, podés ignorar este email con seguridad.
                    </p>
                    <p style="margin:0;font-size:12px;color:#3d5c52;text-align:center;">
                      © 2026 Bio Link Store · <a href="https://biolinkstore.com" style="color:#33b380;text-decoration:none;">biolinkstore.com</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
