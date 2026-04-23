import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

type AttributeLike = {
  type?: string;
  role?: string;
  options?: string[];
  optionsMeta?: Record<string, unknown>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateVariantShape(meta: Record<string, unknown>): string | null {
  for (const [option, raw] of Object.entries(meta)) {
    if (!isPlainObject(raw)) {
      return `optionsMeta.${option} must be an object`;
    }
    const entry = raw as { hex?: unknown; images?: unknown };
    if (entry.hex !== undefined && typeof entry.hex !== 'string') {
      return `optionsMeta.${option}.hex must be string`;
    }
    if (entry.images !== undefined) {
      if (!Array.isArray(entry.images) || entry.images.some((i) => typeof i !== 'string')) {
        return `optionsMeta.${option}.images must be string[]`;
      }
    }
  }
  return null;
}

function validateSelectableShape(meta: Record<string, unknown>): string | null {
  for (const [option, raw] of Object.entries(meta)) {
    if (!isPlainObject(raw)) {
      return `optionsMeta.${option} must be an object`;
    }
    const entry = raw as { priceDelta?: unknown; default?: unknown };
    if (entry.priceDelta !== undefined) {
      if (typeof entry.priceDelta !== 'number' || !Number.isFinite(entry.priceDelta)) {
        return `optionsMeta.${option}.priceDelta must be a finite number`;
      }
    }
    if (entry.default !== undefined && typeof entry.default !== 'boolean') {
      return `optionsMeta.${option}.default must be boolean`;
    }
  }
  return null;
}

function validateDescriptiveShape(meta: Record<string, unknown>): string | null {
  for (const [option, raw] of Object.entries(meta)) {
    if (!isPlainObject(raw)) {
      return `optionsMeta.${option} must be an object`;
    }
    for (const [k, v] of Object.entries(raw)) {
      const t = typeof v;
      if (t !== 'string' && t !== 'number' && t !== 'boolean' && v !== null) {
        return `optionsMeta.${option}.${k} must be string | number | boolean`;
      }
    }
  }
  return null;
}

@ValidatorConstraint({ name: 'ProductAttributeOptionsMeta', async: false })
export class ProductAttributeOptionsMetaConstraint implements ValidatorConstraintInterface {
  private message = 'optionsMeta invalid';

  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === undefined || value === null) return true;
    if (!isPlainObject(value)) {
      this.message = 'optionsMeta must be an object';
      return false;
    }

    const attr = args.object as AttributeLike;
    const role = attr.role ?? 'variant';
    const type = attr.type ?? 'text';
    const options = attr.options ?? [];

    for (const key of Object.keys(value)) {
      if (options.length > 0 && !options.includes(key)) {
        this.message = `optionsMeta key "${key}" not present in options`;
        return false;
      }
    }

    const isDescriptive =
      role === 'spec' || role === 'dietary' || role === 'availability';
    const isSelectable =
      !isDescriptive &&
      (type === 'multi-select' ||
        role === 'ingredient-included' ||
        role === 'ingredient-extra');

    const error = isDescriptive
      ? validateDescriptiveShape(value)
      : isSelectable
        ? validateSelectableShape(value)
        : validateVariantShape(value);
    if (error) {
      this.message = error;
      return false;
    }
    return true;
  }

  defaultMessage(): string {
    return this.message;
  }
}
