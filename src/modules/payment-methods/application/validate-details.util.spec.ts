import { BadRequestException } from '@nestjs/common';
import { validatePaymentMethodDetails } from './validate-details.util';

describe('validatePaymentMethodDetails', () => {
  describe('PAGO_MOVIL', () => {
    it('passes with phone + idNumber + bank', () => {
      expect(() =>
        validatePaymentMethodDetails('PAGO_MOVIL', {
          phone: '+584140000000',
          idNumber: 'V-12345678',
          bank: 'Banesco',
        }),
      ).not.toThrow();
    });

    it.each([
      ['phone', { idNumber: 'V-1', bank: 'B' }],
      ['idNumber', { phone: '+58', bank: 'B' }],
      ['bank', { phone: '+58', idNumber: 'V-1' }],
    ])('throws when %s is missing', (_field, details) => {
      expect(() => validatePaymentMethodDetails('PAGO_MOVIL', details)).toThrow(BadRequestException);
    });

    it('rejects whitespace-only values (treated as empty)', () => {
      expect(() =>
        validatePaymentMethodDetails('PAGO_MOVIL', { phone: '  ', idNumber: 'V-1', bank: 'B' }),
      ).toThrow(BadRequestException);
    });
  });

  describe('ZELLE', () => {
    it('passes with email + holderName', () => {
      expect(() =>
        validatePaymentMethodDetails('ZELLE', { email: 'x@y.com', holderName: 'María' }),
      ).not.toThrow();
    });

    it('throws without email', () => {
      expect(() => validatePaymentMethodDetails('ZELLE', { holderName: 'María' })).toThrow(
        BadRequestException,
      );
    });

    it('throws without holderName', () => {
      expect(() => validatePaymentMethodDetails('ZELLE', { email: 'x@y.com' })).toThrow(
        BadRequestException,
      );
    });
  });

  describe('BINANCE', () => {
    it('passes with binanceId', () => {
      expect(() => validatePaymentMethodDetails('BINANCE', { binanceId: '123456789' })).not.toThrow();
    });

    it('passes with email only (alternate identity)', () => {
      expect(() => validatePaymentMethodDetails('BINANCE', { email: 'pay@example.com' })).not.toThrow();
    });

    it('throws when neither binanceId nor email is present', () => {
      expect(() => validatePaymentMethodDetails('BINANCE', {})).toThrow(BadRequestException);
    });
  });

  describe('TRANSFER', () => {
    it('passes with bank + accountNumber + accountType + idNumber + holderName', () => {
      expect(() =>
        validatePaymentMethodDetails('TRANSFER', {
          bank: 'Mercantil',
          accountNumber: '0105-0000-00-0000000000',
          accountType: 'corriente',
          idNumber: 'V-12345678',
          holderName: 'Antonio Vila',
        }),
      ).not.toThrow();
    });

    it('throws when any required field is missing', () => {
      expect(() =>
        validatePaymentMethodDetails('TRANSFER', {
          bank: 'M',
          accountNumber: '1',
          accountType: 'corriente',
          holderName: 'X',
          // idNumber missing
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('CASH', () => {
    it('passes with currency', () => {
      expect(() => validatePaymentMethodDetails('CASH', { currency: 'USD' })).not.toThrow();
      expect(() => validatePaymentMethodDetails('CASH', { currency: 'VES' })).not.toThrow();
    });

    it('throws without currency', () => {
      expect(() => validatePaymentMethodDetails('CASH', {})).toThrow(BadRequestException);
    });
  });

  describe('OTHER', () => {
    it('accepts any details (free-form payment method)', () => {
      expect(() => validatePaymentMethodDetails('OTHER', {})).not.toThrow();
      expect(() => validatePaymentMethodDetails('OTHER', { whatever: 'x' })).not.toThrow();
    });
  });
});
