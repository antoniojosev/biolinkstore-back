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
<body style="margin:0;padding:0;background-color:#111318;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111318;min-height:100%;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 32px 0;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-size:22px;font-weight:700;color:#33b380;letter-spacing:-0.3px;">
                    Bio Link Store
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#1a1d24;border-radius:16px;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Lock icon -->
                <tr>
                  <td align="center" style="padding:40px 40px 0 40px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="width:56px;height:56px;background-color:#252830;border-radius:50%;text-align:center;font-size:24px;line-height:56px;">
                          &#128274;
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td align="center" style="padding:20px 40px 0 40px;">
                    <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Restablecer contraseña</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 40px 0 40px;">
                    <p style="margin:0;font-size:14px;color:#8b8f9a;line-height:1.5;">Te ayudamos a volver a tu cuenta</p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:28px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="height:1px;background-color:#2a2d35;font-size:1px;line-height:1px;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:0 40px;">
                    <p style="margin:0 0 16px 0;font-size:15px;color:#c5c8d0;line-height:1.6;">
                      Hola <strong style="color:#ffffff;">${name}</strong>,
                    </p>
                    <p style="margin:0;font-size:15px;color:#8b8f9a;line-height:1.6;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé clic en el botón de abajo para crear una nueva.
                    </p>
                  </td>
                </tr>

                <!-- Button -->
                <tr>
                  <td align="center" style="padding:32px 40px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#33b380;border-radius:8px;">
                          <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 40px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                            Restablecer contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Expiry notice -->
                <tr>
                  <td style="padding:0 40px 28px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:#252830;border-radius:8px;padding:12px 16px;text-align:center;">
                          <p style="margin:0;font-size:13px;color:#8b8f9a;">
                            Este enlace expira en <strong style="color:#c5c8d0;">1 hora</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="height:1px;background-color:#2a2d35;font-size:1px;line-height:1px;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fallback URL -->
                <tr>
                  <td style="padding:24px 40px 36px 40px;">
                    <p style="margin:0 0 10px 0;font-size:12px;color:#6b6f7a;">
                      Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                    </p>
                    <p style="margin:0;font-size:11px;color:#5a7a6e;word-break:break-all;">
                      ${resetUrl}
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 0 0 0;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#52555e;">
                Si no solicitaste este cambio, podés ignorar este email.
              </p>
              <p style="margin:0;font-size:12px;color:#52555e;">
                &copy; 2026 Bio Link Store
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
