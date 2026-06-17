import { ForbiddenException } from '@nestjs/common';

type Plan = 'FREE' | 'PRO' | 'BUSINESS';

export function enforceWhatsappTemplateEditAccess(plan: Plan | undefined): void {
  if (!plan || plan === 'FREE') {
    throw new ForbiddenException(
      'Plan FREE usa la plantilla de WhatsApp por defecto. Mejora a Pro para personalizarla.',
    );
  }
}
