import { Injectable, Inject, Logger } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IPaymentReportRepository } from '../../domain/repositories/payment-report.repository.interface';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { EmailService } from '@/modules/email/email.service';
import { CreatePaymentReportDto } from '../dto/create-payment-report.dto';
import { PaymentReportResponseDto } from '../dto/payment-report-response.dto';
import { PaymentReportMapper } from '../mappers/payment-report.mapper';

const ADMIN_EMAIL = 'antoniovila.dev@gmail.com';

const TYPE_LABELS: Record<string, string> = {
  PLAN_UPGRADE: 'Upgrade de plan',
  DOMAIN: 'Dominio personalizado',
  DESIGN: 'Diseño personalizado',
};

@Injectable()
export class CreatePaymentReportUseCase {
  private readonly logger = new Logger(CreatePaymentReportUseCase.name);

  constructor(
    @Inject(INJECTION_TOKENS.PAYMENT_REPORT_REPOSITORY)
    private readonly repo: IPaymentReportRepository,
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepo: IStoreRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(storeId: string, dto: CreatePaymentReportDto): Promise<PaymentReportResponseDto> {
    const report = await this.repo.create({
      storeId,
      type: dto.type,
      targetPlan: dto.targetPlan ?? null,
      name: dto.name,
      phone: dto.phone,
      bank: dto.bank,
      transferDate: new Date(dto.transferDate),
      proofUrl: dto.proofUrl,
      notes: dto.notes ?? null,
    });

    // Send admin notification — fire and forget
    this.sendAdminNotification(storeId, dto).catch((err) =>
      this.logger.error(`Failed to send payment report email: ${err.message}`),
    );

    return PaymentReportMapper.toResponse(report);
  }

  private async sendAdminNotification(storeId: string, dto: CreatePaymentReportDto): Promise<void> {
    const store = await this.storeRepo.findByIdWithSubscription(storeId);

    const typeLabel = TYPE_LABELS[dto.type] ?? dto.type;
    const transferDate = new Date(dto.transferDate).toLocaleDateString('es-VE', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d1218;font-family:system-ui,sans-serif;color:#e5e7eb;">
  <div style="max-width:560px;margin:32px auto;background:#131920;border:1px solid #ffffff18;border-radius:16px;overflow:hidden;">

    <div style="background:linear-gradient(135deg,#33b38020,#327be215);border-bottom:1px solid #ffffff12;padding:28px 32px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;color:#33b380;text-transform:uppercase;">Bio Link Store</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Nuevo reporte de pago</h1>
      <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">${typeLabel}${dto.targetPlan ? ` — Plan ${dto.targetPlan}` : ''}</p>
    </div>

    <div style="padding:28px 32px;display:flex;flex-direction:column;gap:20px;">

      <div style="background:#0d1218;border:1px solid #ffffff10;border-radius:12px;padding:18px 20px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:0.06em;color:#6b7280;text-transform:uppercase;">Datos de la tienda</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280;width:120px;">Tienda</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;font-weight:500;">${store?.name ?? '—'}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280;">Username</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;font-family:monospace;">${store?.username ?? store?.slug ?? '—'}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280;">Store ID</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;font-family:monospace;">${storeId}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280;">Plan actual</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;">${store?.subscription?.plan ?? 'FREE'}</td></tr>
        </table>
      </div>

      <div style="background:#0d1218;border:1px solid #ffffff10;border-radius:12px;padding:18px 20px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:0.06em;color:#6b7280;text-transform:uppercase;">Datos del cliente</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280;width:120px;">Nombre</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;font-weight:500;">${dto.name}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280;">Teléfono</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;">${dto.phone}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280;">Banco</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;">${dto.bank}</td></tr>
          <tr><td style="padding:4px 0;font-size:12px;color:#6b7280;">Fecha de transf.</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;">${transferDate}</td></tr>
          ${dto.notes ? `<tr><td style="padding:4px 0;font-size:12px;color:#6b7280;">Notas</td><td style="padding:4px 0;font-size:13px;color:#f3f4f6;">${dto.notes}</td></tr>` : ''}
        </table>
      </div>

      <a href="${dto.proofUrl}" style="display:block;text-align:center;padding:12px 20px;background:#33b380;color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;">
        Ver comprobante →
      </a>

    </div>

    <div style="padding:16px 32px;border-top:1px solid #ffffff0a;text-align:center;">
      <p style="margin:0;font-size:11px;color:#374151;">Bio Link Store · ${new Date().toLocaleString('es-VE')}</p>
    </div>

  </div>
</body>
</html>`;

    await this.emailService.sendEmail(
      ADMIN_EMAIL,
      `[Pago] ${typeLabel} — ${store?.name ?? storeId}`,
      html,
    );
  }
}
