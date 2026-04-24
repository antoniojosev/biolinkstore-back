import { Injectable } from '@nestjs/common';
import { OrderIntent } from '../entities/order-intent.entity';
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  WhatsappOrderData,
  WhatsappStoreData,
  WhatsappTemplateEngine,
} from '@/modules/stores/domain/services/whatsapp-template.engine';

export interface MessageStoreContext {
  name: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  whatsappTemplate: string | null;
}

@Injectable()
export class MessageGeneratorService {
  constructor(private readonly engine: WhatsappTemplateEngine) {}

  generateWhatsAppMessage(order: OrderIntent, store: MessageStoreContext): string {
    const template = store.whatsappTemplate ?? DEFAULT_WHATSAPP_TEMPLATE;
    return this.engine.render(template, {
      store: this.toWhatsappStoreData(store),
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

  private toWhatsappStoreData(store: MessageStoreContext): WhatsappStoreData {
    return {
      name: store.name,
      slug: store.slug,
      phone: store.phone ?? null,
      address: store.address ?? null,
      email: store.email ?? null,
    };
  }

  private toWhatsappOrderData(order: OrderIntent): WhatsappOrderData {
    return {
      id: order.id,
      orderNumber: null,
      items: order.items.map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
      subtotal: order.subtotal,
      total: order.total,
      currency: order.currency,
      exchangeRate: order.exchangeRateSnapshot ?? null,
      exchangeRateSource: order.exchangeRateSourceSnapshot ?? null,
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
