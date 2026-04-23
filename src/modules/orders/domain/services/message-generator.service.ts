import { Injectable } from '@nestjs/common';
import { OrderIntent } from '../entities/order-intent.entity';
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  WhatsappOrderData,
  WhatsappTemplateEngine,
} from '@/modules/stores/domain/services/whatsapp-template.engine';

@Injectable()
export class MessageGeneratorService {
  constructor(private readonly engine: WhatsappTemplateEngine) {}

  generateWhatsAppMessage(
    order: OrderIntent,
    store: { name: string; slug: string; whatsappTemplate: string | null },
  ): string {
    const template = store.whatsappTemplate ?? DEFAULT_WHATSAPP_TEMPLATE;
    return this.engine.render(template, {
      store: { name: store.name, slug: store.slug },
      order: this.toWhatsappOrderData(order),
    });
  }

  generateWhatsAppUrl(phoneNumber: string, message: string): string {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  generateOrderSummary(order: OrderIntent): string {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    return `Pedido de ${itemCount} producto(s) - Total: $${order.total.toFixed(2)}`;
  }

  private toWhatsappOrderData(order: OrderIntent): WhatsappOrderData {
    return {
      id: order.id,
      items: order.items.map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
      subtotal: order.subtotal,
      total: order.total,
      currency: order.currency,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      customerNotes: order.customerNotes,
      payment: order.payment
        ? {
            label: order.payment.label,
            type: order.payment.type,
            details: order.payment.details,
            instructions: order.payment.instructions,
          }
        : null,
      createdAt: order.createdAt,
    };
  }
}
