import { Injectable } from '@nestjs/common';
import { OrderIntent } from '../entities/order-intent.entity';

@Injectable()
export class MessageGeneratorService {
  /**
   * Generates a formatted WhatsApp message from an order intent
   */
  generateWhatsAppMessage(order: OrderIntent, storeName: string): string {
    const lines: string[] = [];

    lines.push(`🛍️ *Nuevo Pedido - ${storeName}*`);
    lines.push('');
    lines.push('📦 *Productos:*');

    order.items.forEach((item, index) => {
      const variantInfo = item.variantName ? ` (${item.variantName})` : '';
      lines.push(
        `${index + 1}. ${item.productName}${variantInfo}`,
      );
      lines.push(`   Cantidad: ${item.quantity}`);
      lines.push(`   Precio: $${item.unitPrice.toFixed(2)}`);
      lines.push(`   Subtotal: $${(item.unitPrice * item.quantity).toFixed(2)}`);
      lines.push('');
    });

    lines.push(`💰 *Total: $${order.total.toFixed(2)}*`);
    lines.push('');

    if (order.customerName) {
      lines.push('👤 *Datos del Cliente:*');
      lines.push(`Nombre: ${order.customerName}`);
      if (order.customerPhone) {
        lines.push(`Teléfono: ${order.customerPhone}`);
      }
      if (order.customerEmail) {
        lines.push(`Email: ${order.customerEmail}`);
      }
      if (order.customerAddress) {
        lines.push(`Dirección: ${order.customerAddress}`);
      }
      lines.push('');
    }

    if (order.customerNotes) {
      lines.push('📝 *Notas:*');
      lines.push(order.customerNotes);
      lines.push('');
    }

    lines.push('_Pedido generado desde el catálogo web_');

    return lines.join('\n');
  }

  /**
   * Generates a WhatsApp URL with pre-filled message
   */
  generateWhatsAppUrl(phoneNumber: string, message: string): string {
    // Remove any non-numeric characters from phone
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // URL encode the message
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  /**
   * Generates order summary for display
   */
  generateOrderSummary(order: OrderIntent): string {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
    return `Pedido de ${itemCount} producto(s) - Total: $${order.total.toFixed(2)}`;
  }
}
