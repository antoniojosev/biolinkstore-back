/**
 * SectionSchemaValidator — BE-120b.
 *
 * Validador puro del árbol de secciones contra el sectionSchema declarativo del template.
 *
 * Reglas (lenientes):
 *   - section.type no declarado => sección entera ignorada (no error).
 *   - section.props con keys no declaradas => keys descartadas silenciosamente.
 *   - section.key duplicado dentro del array => error 400.
 *   - section.props con tipo inválido (ej. number en string) => error 400.
 *
 * Validators por prop type:
 *   - 'text'    { max? }                                 -> string + length<=max
 *   - 'string'  { pattern? }                             -> string + regex
 *   - 'enum'    { options: string[] }                    -> debe estar en options
 *   - 'boolean'                                          -> typeof boolean
 *   - 'number'  { min?, max? }                           -> typeof number + rango
 *   - 'color'                                            -> hex #RRGGBB
 *   - 'image'                                            -> string URL
 *   - 'list'    { itemSchema: PropDef map, max? }        -> array + recursión por item
 *
 * Output:
 *   - { valid: SanitizedSection[], errors: string[] }
 *   - Si errors.length > 0, el use case lanza BadRequest. Caso contrario,
 *     `valid` es lo que se persiste (ya filtrado de props desconocidas).
 */

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export type PropType =
  | 'text'
  | 'string'
  | 'enum'
  | 'boolean'
  | 'number'
  | 'color'
  | 'image'
  | 'list';

export interface PropDef {
  type: PropType;
  // text/list
  max?: number;
  // number
  min?: number;
  // string
  pattern?: string;
  // enum
  options?: string[];
  // list
  itemSchema?: Record<string, PropDef>;
}

export interface SectionDef {
  type: string;
  key: string;
  removable?: boolean;
  props?: Record<string, PropDef>;
}

export interface SectionSchema {
  defaultOrder?: string[];
  sections: SectionDef[];
}

export interface RawSection {
  type?: unknown;
  key?: unknown;
  visible?: unknown;
  variant?: unknown;
  props?: unknown;
  // permite metadata extra (ignorada)
  [k: string]: unknown;
}

export interface SanitizedSection {
  type: string;
  key: string;
  visible: boolean;
  variant?: string;
  props: Record<string, unknown>;
}

export interface ValidationResult {
  valid: SanitizedSection[];
  errors: string[];
}

/**
 * Valida y sanea el array de secciones contra el schema. Pure function — no side effects.
 */
export function validateSections(
  rawSections: unknown,
  schema: SectionSchema | null | undefined,
): ValidationResult {
  const errors: string[] = [];
  const valid: SanitizedSection[] = [];

  if (!Array.isArray(rawSections)) {
    return {
      valid,
      errors: ['sections: debe ser un array'],
    };
  }

  if (!schema || !Array.isArray(schema.sections)) {
    // Sin schema referencia, no hay forma de validar; descartamos todo de forma segura.
    return { valid, errors };
  }

  // Index de definiciones por type para lookup O(1).
  const sectionDefByType = new Map<string, SectionDef>();
  for (const def of schema.sections) {
    if (def && typeof def.type === 'string') {
      sectionDefByType.set(def.type, def);
    }
  }

  // Tracking de keys para detectar duplicados.
  const seenKeys = new Set<string>();

  for (let i = 0; i < rawSections.length; i++) {
    const raw = rawSections[i] as RawSection | null;

    if (!raw || typeof raw !== 'object') {
      errors.push(`sections[${i}]: debe ser un objeto`);
      continue;
    }

    const type = raw.type;
    const key = raw.key;

    if (typeof type !== 'string' || type.length === 0) {
      errors.push(`sections[${i}].type: requerido (string)`);
      continue;
    }

    if (typeof key !== 'string' || key.length === 0) {
      errors.push(`sections[${i}].key: requerido (string)`);
      continue;
    }

    // Lenient: si el type no está declarado, ignoramos toda la sección sin error.
    const def = sectionDefByType.get(type);
    if (!def) {
      continue;
    }

    if (seenKeys.has(key)) {
      errors.push(`sections[${i}].key: duplicado "${key}"`);
      continue;
    }
    seenKeys.add(key);

    const visible = typeof raw.visible === 'boolean' ? raw.visible : true;
    const variant = typeof raw.variant === 'string' ? raw.variant : undefined;

    const propsResult = validatePropsAgainstDef(
      raw.props,
      def.props || {},
      `sections[${i}].props`,
    );
    errors.push(...propsResult.errors);

    valid.push({
      type,
      key,
      visible,
      ...(variant !== undefined ? { variant } : {}),
      props: propsResult.value,
    });
  }

  return { valid, errors };
}

interface PropsValidationResult {
  value: Record<string, unknown>;
  errors: string[];
}

function validatePropsAgainstDef(
  rawProps: unknown,
  schemaProps: Record<string, PropDef>,
  pathPrefix: string,
): PropsValidationResult {
  const errors: string[] = [];
  const value: Record<string, unknown> = {};

  if (rawProps === undefined || rawProps === null) {
    return { value, errors };
  }

  if (typeof rawProps !== 'object' || Array.isArray(rawProps)) {
    return {
      value,
      errors: [`${pathPrefix}: debe ser un objeto`],
    };
  }

  const propsObj = rawProps as Record<string, unknown>;

  for (const [propKey, propDef] of Object.entries(schemaProps)) {
    if (!(propKey in propsObj)) {
      continue; // partial submission tolerado
    }
    const rawVal = propsObj[propKey];
    const propPath = `${pathPrefix}.${propKey}`;
    const result = validateSingleProp(rawVal, propDef, propPath);
    errors.push(...result.errors);
    if (result.errors.length === 0 && result.value !== undefined) {
      value[propKey] = result.value;
    }
  }

  // keys no declaradas en schemaProps son ignoradas silenciosamente (lenient).

  return { value, errors };
}

interface SinglePropResult {
  value: unknown;
  errors: string[];
}

function validateSingleProp(
  rawVal: unknown,
  def: PropDef,
  path: string,
): SinglePropResult {
  switch (def.type) {
    case 'text': {
      if (typeof rawVal !== 'string') {
        return { value: undefined, errors: [`${path}: debe ser string`] };
      }
      if (def.max !== undefined && rawVal.length > def.max) {
        return {
          value: undefined,
          errors: [`${path}: excede max ${def.max} caracteres`],
        };
      }
      return { value: rawVal, errors: [] };
    }
    case 'string': {
      if (typeof rawVal !== 'string') {
        return { value: undefined, errors: [`${path}: debe ser string`] };
      }
      if (def.pattern !== undefined) {
        let regex: RegExp;
        try {
          regex = new RegExp(def.pattern);
        } catch {
          return {
            value: undefined,
            errors: [`${path}: schema pattern inválido`],
          };
        }
        if (!regex.test(rawVal)) {
          return {
            value: undefined,
            errors: [`${path}: no coincide con patrón ${def.pattern}`],
          };
        }
      }
      return { value: rawVal, errors: [] };
    }
    case 'enum': {
      // Lenient: un valor fuera de options (o de tipo inválido) se DESCARTA en
      // silencio y la sección usa el default del renderer — en vez de fallar
      // todo el guardado. Así cambiar/quitar opciones del schema no brickea
      // borradores que quedaron con un valor viejo (ej. 'list' removido).
      if (
        typeof rawVal === 'string' &&
        Array.isArray(def.options) &&
        def.options.includes(rawVal)
      ) {
        return { value: rawVal, errors: [] };
      }
      return { value: undefined, errors: [] };
    }
    case 'boolean': {
      if (typeof rawVal !== 'boolean') {
        return { value: undefined, errors: [`${path}: debe ser boolean`] };
      }
      return { value: rawVal, errors: [] };
    }
    case 'number': {
      if (typeof rawVal !== 'number' || Number.isNaN(rawVal)) {
        return { value: undefined, errors: [`${path}: debe ser number`] };
      }
      if (def.min !== undefined && rawVal < def.min) {
        return {
          value: undefined,
          errors: [`${path}: menor que min ${def.min}`],
        };
      }
      if (def.max !== undefined && rawVal > def.max) {
        return {
          value: undefined,
          errors: [`${path}: mayor que max ${def.max}`],
        };
      }
      return { value: rawVal, errors: [] };
    }
    case 'color': {
      if (typeof rawVal !== 'string' || !HEX_COLOR_REGEX.test(rawVal)) {
        return {
          value: undefined,
          errors: [`${path}: debe ser color hex #RRGGBB`],
        };
      }
      return { value: rawVal, errors: [] };
    }
    case 'image': {
      if (typeof rawVal !== 'string' || rawVal.length === 0) {
        return {
          value: undefined,
          errors: [`${path}: debe ser URL string`],
        };
      }
      return { value: rawVal, errors: [] };
    }
    case 'list': {
      if (!Array.isArray(rawVal)) {
        return { value: undefined, errors: [`${path}: debe ser array`] };
      }
      if (def.max !== undefined && rawVal.length > def.max) {
        return {
          value: undefined,
          errors: [`${path}: excede max ${def.max} items`],
        };
      }
      const itemSchema = def.itemSchema || {};
      const errors: string[] = [];
      const cleanedItems: Record<string, unknown>[] = [];
      for (let i = 0; i < rawVal.length; i++) {
        const itemPath = `${path}[${i}]`;
        const itemResult = validatePropsAgainstDef(
          rawVal[i],
          itemSchema,
          itemPath,
        );
        errors.push(...itemResult.errors);
        if (itemResult.errors.length === 0) {
          cleanedItems.push(itemResult.value);
        }
      }
      if (errors.length > 0) {
        return { value: undefined, errors };
      }
      return { value: cleanedItems, errors: [] };
    }
    default: {
      // Tipo desconocido en el schema => no validamos, descartamos para no persistir basura.
      return {
        value: undefined,
        errors: [`${path}: tipo de prop desconocido en schema`],
      };
    }
  }
}
