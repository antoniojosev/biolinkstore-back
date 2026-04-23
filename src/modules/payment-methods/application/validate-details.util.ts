import { BadRequestException } from '@nestjs/common';
import { PaymentMethodType } from '../domain/entities/payment-method.entity';

type Validator = (details: Record<string, unknown>) => string | null;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

const validators: Record<PaymentMethodType, Validator> = {
  PAGO_MOVIL: (d) => {
    if (!isNonEmptyString(d.phone)) return 'details.phone es requerido';
    if (!isNonEmptyString(d.idNumber)) return 'details.idNumber es requerido';
    if (!isNonEmptyString(d.bank)) return 'details.bank es requerido';
    return null;
  },
  ZELLE: (d) => {
    if (!isNonEmptyString(d.email)) return 'details.email es requerido';
    if (!isNonEmptyString(d.holderName)) return 'details.holderName es requerido';
    return null;
  },
  BINANCE: (d) => {
    if (!isNonEmptyString(d.binanceId) && !isNonEmptyString(d.email)) {
      return 'details.binanceId o details.email es requerido';
    }
    return null;
  },
  TRANSFER: (d) => {
    if (!isNonEmptyString(d.bank)) return 'details.bank es requerido';
    if (!isNonEmptyString(d.accountNumber)) return 'details.accountNumber es requerido';
    if (!isNonEmptyString(d.accountType)) return 'details.accountType es requerido (ahorros | corriente)';
    if (!isNonEmptyString(d.idNumber)) return 'details.idNumber es requerido';
    if (!isNonEmptyString(d.holderName)) return 'details.holderName es requerido';
    return null;
  },
  CASH: (d) => {
    if (!isNonEmptyString(d.currency)) return 'details.currency es requerido (USD | VES)';
    return null;
  },
  OTHER: () => null,
};

/**
 * Valida la forma del campo `details` segun el tipo.
 * Lanza BadRequestException si falta algun campo requerido.
 */
export function validatePaymentMethodDetails(
  type: PaymentMethodType,
  details: Record<string, unknown>,
): void {
  const err = validators[type](details);
  if (err) throw new BadRequestException(err);
}
