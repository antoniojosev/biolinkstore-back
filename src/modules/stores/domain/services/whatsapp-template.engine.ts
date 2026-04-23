import { Injectable } from '@nestjs/common';

export interface WhatsappItemData {
  productName: string;
  variantName?: string | null;
  unitPrice: number;
  quantity: number;
}

export interface WhatsappOrderData {
  id: string;
  items: WhatsappItemData[];
  subtotal: number;
  total: number;
  currency: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  customerNotes?: string | null;
  createdAt: Date;
}

export interface WhatsappTemplateContext {
  store: { name: string; slug: string };
  order: WhatsappOrderData;
}

const ITEM_BLOCK_RE = /\{#items\}([\s\S]*?)\{\/items\}/g;
const VAR_RE = /\{([a-zA-Z][a-zA-Z0-9_.]*)\}/g;

const SUPPORTED_ROOT_VARS = [
  'store.name',
  'store.slug',
  'customer.name',
  'customer.phone',
  'customer.email',
  'customer.address',
  'customer.notes',
  'subtotal',
  'total',
  'currency',
  'order.id',
  'order.date',
  'items',
] as const;

const SUPPORTED_ITEM_VARS = [
  'item.name',
  'item.variant',
  'item.qty',
  'item.unitPrice',
  'item.subtotal',
] as const;

export const MAX_WHATSAPP_TEMPLATE_LENGTH = 2000;

export const DEFAULT_WHATSAPP_TEMPLATE = `🛍️ *Nuevo Pedido - {store.name}*

📦 *Productos:*
{#items}{item.name}{item.variant}
   Cantidad: {item.qty}
   Precio: {item.unitPrice}
   Subtotal: {item.subtotal}

{/items}
💰 *Total: {total}*

👤 *Datos del Cliente:*
Nombre: {customer.name}
Teléfono: {customer.phone}
Email: {customer.email}
Dirección: {customer.address}

📝 *Notas:* {customer.notes}

_Pedido generado desde el catálogo web_`;

@Injectable()
export class WhatsappTemplateEngine {
  render(template: string, ctx: WhatsappTemplateContext): string {
    const withItems = template.replace(ITEM_BLOCK_RE, (_match, inner: string) =>
      this.renderItems(inner, ctx.order.items, ctx.order.currency),
    );
    const rendered = withItems.replace(VAR_RE, (match, path: string) => {
      const value = this.resolveRootVar(path, ctx);
      return value ?? match;
    });
    return this.collapseBlankLines(rendered);
  }

  listSupportedVariables(): { root: readonly string[]; item: readonly string[] } {
    return { root: SUPPORTED_ROOT_VARS, item: SUPPORTED_ITEM_VARS };
  }

  validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (typeof template !== 'string') {
      return { valid: false, errors: ['template must be a string'] };
    }
    if (template.length > MAX_WHATSAPP_TEMPLATE_LENGTH) {
      errors.push(`template exceeds ${MAX_WHATSAPP_TEMPLATE_LENGTH} chars`);
    }

    const openCount = (template.match(/\{#items\}/g) ?? []).length;
    const closeCount = (template.match(/\{\/items\}/g) ?? []).length;
    if (openCount !== closeCount) {
      errors.push('unbalanced {#items}/{/items} tags');
    }
    if (openCount > 1) {
      errors.push('only one {#items} block allowed');
    }

    const blockMatch = /\{#items\}([\s\S]*?)\{\/items\}/.exec(template);
    const insideBlock = blockMatch ? blockMatch[1] : '';
    const outsideBlock = blockMatch
      ? template.slice(0, blockMatch.index) +
        template.slice(blockMatch.index + blockMatch[0].length)
      : template;

    for (const match of outsideBlock.matchAll(VAR_RE)) {
      const varName = match[1];
      if (!SUPPORTED_ROOT_VARS.includes(varName as typeof SUPPORTED_ROOT_VARS[number])) {
        errors.push(`unknown variable "{${varName}}" outside items block`);
      }
    }
    for (const match of insideBlock.matchAll(VAR_RE)) {
      const varName = match[1];
      const isItemVar = SUPPORTED_ITEM_VARS.includes(varName as typeof SUPPORTED_ITEM_VARS[number]);
      const isRootVar = SUPPORTED_ROOT_VARS.includes(varName as typeof SUPPORTED_ROOT_VARS[number]);
      if (!isItemVar && !isRootVar) {
        errors.push(`unknown variable "{${varName}}" inside items block`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  buildSampleContext(storeName: string, storeSlug: string): WhatsappTemplateContext {
    return {
      store: { name: storeName, slug: storeSlug },
      order: {
        id: 'preview-123',
        items: [
          { productName: 'Producto A', variantName: 'Talla M', unitPrice: 19.99, quantity: 2 },
          { productName: 'Producto B', variantName: null, unitPrice: 9.5, quantity: 1 },
        ],
        subtotal: 49.48,
        total: 49.48,
        currency: 'USD',
        customerName: 'Juan Perez',
        customerPhone: '+58 412 1234567',
        customerEmail: 'juan@example.com',
        customerAddress: 'Calle 1, Caracas',
        customerNotes: 'Entregar en la tarde',
        createdAt: new Date(),
      },
    };
  }

  private renderItems(inner: string, items: WhatsappItemData[], currency: string): string {
    return items.map((item) => this.renderItemLine(inner, item, currency)).join('');
  }

  private renderItemLine(inner: string, item: WhatsappItemData, currency: string): string {
    return inner.replace(VAR_RE, (match, path: string) => {
      switch (path) {
        case 'item.name':
          return item.productName;
        case 'item.variant':
          return item.variantName ? ` (${item.variantName})` : '';
        case 'item.qty':
          return String(item.quantity);
        case 'item.unitPrice':
          return this.formatMoney(item.unitPrice, currency);
        case 'item.subtotal':
          return this.formatMoney(item.unitPrice * item.quantity, currency);
        default:
          return match;
      }
    });
  }

  private resolveRootVar(path: string, ctx: WhatsappTemplateContext): string | null {
    const { store, order } = ctx;
    switch (path) {
      case 'store.name':
        return store.name;
      case 'store.slug':
        return store.slug;
      case 'customer.name':
        return order.customerName ?? '';
      case 'customer.phone':
        return order.customerPhone ?? '';
      case 'customer.email':
        return order.customerEmail ?? '';
      case 'customer.address':
        return order.customerAddress ?? '';
      case 'customer.notes':
        return order.customerNotes ?? '';
      case 'subtotal':
        return this.formatMoney(order.subtotal, order.currency);
      case 'total':
        return this.formatMoney(order.total, order.currency);
      case 'currency':
        return order.currency;
      case 'order.id':
        return order.id;
      case 'order.date':
        return order.createdAt.toISOString();
      case 'items':
        return '';
      default:
        return null;
    }
  }

  private formatMoney(amount: number, currency: string): string {
    const symbol = currency === 'USD' ? '$' : currency === 'VES' ? 'Bs ' : `${currency} `;
    return `${symbol}${amount.toFixed(2)}`;
  }

  private collapseBlankLines(text: string): string {
    return text.replace(/\n{3,}/g, '\n\n');
  }
}
