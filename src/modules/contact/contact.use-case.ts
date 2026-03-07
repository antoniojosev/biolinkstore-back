import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '@/modules/email/email.service';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { DemoRequestDto } from './dto/demo-request.dto';
import { InquiryDto } from './dto/inquiry.dto';

@Injectable()
export class ContactUseCase {
  constructor(
    private emailService: EmailService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  get adminEmail(): string {
    return this.configService.get<string>('email.adminEmail') || 'antoniovila.dev@gmail.com';
  }

  async sendDemoRequest(dto: DemoRequestDto): Promise<{ message: string }> {
    const html = this.getDemoRequestEmailHtml(dto);

    await this.emailService.sendEmail(
      this.adminEmail,
      `Nueva solicitud de demo: ${dto.name}`,
      html,
    );

    return { message: 'Solicitud de demo enviada exitosamente' };
  }

  async sendInquiry(dto: InquiryDto): Promise<{ message: string }> {
    await this.prisma.inquiry.create({
      data: {
        storeId: dto.storeId,
        type: dto.type,
        method: dto.method,
        contact: dto.contact,
        description: dto.description ?? null,
      },
    });

    const typeLabel = dto.type === 'DESIGN' ? 'Diseño exclusivo' : 'Plan personalizado';
    const methodLabel = dto.method === 'whatsapp' ? 'WhatsApp' : 'Email';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d1218;font-family:system-ui,sans-serif;color:#e5e7eb;">
  <div style="max-width:560px;margin:32px auto;background:#131920;border:1px solid #ffffff18;border-radius:16px;overflow:hidden;">

    <div style="background:linear-gradient(135deg,#33b38020,#327be215);border-bottom:1px solid #ffffff12;padding:28px 32px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#33b380;text-transform:uppercase;">Bio Link Store</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Nueva solicitud — ${typeLabel}</h1>
      <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">${dto.storeName}</p>
    </div>

    <div style="padding:28px 32px;">
      <div style="background:#0d1218;border:1px solid #ffffff10;border-radius:12px;padding:18px 20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280;width:120px;">Tienda</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;font-weight:500;">${dto.storeName}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280;">Método</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;">${methodLabel}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280;">Contacto</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;font-family:monospace;">${dto.contact}</td></tr>
          ${dto.description ? `<tr><td style="padding:4px 0;font-size:12px;color:#6b7280;vertical-align:top;">Descripción</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;">${dto.description}</td></tr>` : ''}
        </table>
      </div>
    </div>

    <div style="padding:16px 32px;border-top:1px solid #ffffff0a;text-align:center;">
      <p style="margin:0;font-size:11px;color:#374151;">Bio Link Store · ${new Date().toLocaleString('es-VE')}</p>
    </div>

  </div>
</body>
</html>`;

    await this.emailService.sendEmail(
      this.adminEmail,
      `[${typeLabel}] Solicitud de ${dto.storeName}`,
      html,
    );

    return { message: 'Solicitud enviada exitosamente' };
  }

  private getDemoRequestEmailHtml(data: DemoRequestDto): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva solicitud de demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0f14; color: #ffffff; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: linear-gradient(145deg, #111920 0%, #0a0f14 100%); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 40px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #33b380; }
    .field { margin-bottom: 16px; }
    .label { font-size: 12px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 16px; color: #ffffff; }
    .badge { display: inline-block; background: linear-gradient(135deg, #33b380 0%, #2a9669 100%); color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Nueva solicitud de demo personalizada</h1>
      
      <div class="field">
        <div class="label">Nombre completo</div>
        <div class="value">${data.name}</div>
      </div>
      
      <div class="field">
        <div class="label">Email</div>
        <div class="value">${data.email}</div>
      </div>
      
      <div class="field">
        <div class="label">Teléfono</div>
        <div class="value">${data.phone}</div>
      </div>
      
      ${
        data.company
          ? `
      <div class="field">
        <div class="label">Empresa</div>
        <div class="value">${data.company}</div>
      </div>
      `
          : ''
      }
      
      ${
        data.instagram
          ? `
      <div class="field">
        <div class="label">Instagram</div>
        <div class="value">${data.instagram}</div>
      </div>
      `
          : ''
      }
      
      ${
        data.message
          ? `
      <div class="field">
        <div class="label">Mensaje</div>
        <div class="value">${data.message}</div>
      </div>
      `
          : ''
      }
      
      <div class="field">
        <div class="label">Fecha y hora solicitada</div>
        <div class="value"><span class="badge">${data.date} a las ${data.time}:00 hs</span></div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }
}
