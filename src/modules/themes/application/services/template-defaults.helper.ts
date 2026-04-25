import { Template } from '../../domain/entities/template.entity';

/**
 * Helpers para construir el draft inicial cuando un template se activa por primera vez
 * en un store, o cuando se hace reset y no hay published para usar como base.
 */

export interface DefaultSection {
  type: string;
  key: string;
  visible: boolean;
  props: Record<string, unknown>;
}

export interface DefaultTree {
  template: string;
  templateVersion: number;
  sections: DefaultSection[];
}

interface SectionDefShape {
  type: string;
  key: string;
}

interface SectionSchemaShape {
  defaultOrder?: string[];
  sections?: SectionDefShape[];
}

export function defaultTreeFor(template: Template): DefaultTree {
  const schema = (template.sectionSchema || {}) as SectionSchemaShape;
  const order = Array.isArray(schema.defaultOrder) ? schema.defaultOrder : [];
  const definitions = Array.isArray(schema.sections) ? schema.sections : [];

  const sections: DefaultSection[] = [];
  for (const sectionKey of order) {
    const def = definitions.find(
      (d) => d && typeof d.key === 'string' && d.key === sectionKey,
    );
    if (!def || typeof def.type !== 'string') {
      // Schema inconsistente: la key listada en defaultOrder no tiene definición.
      // Saltar en lugar de crear una sección sin tipo (que no rendereará).
      continue;
    }
    sections.push({
      type: def.type,
      key: def.key,
      visible: true,
      props: {},
    });
  }

  return {
    template: template.key,
    templateVersion: template.version,
    sections,
  };
}

export function defaultTokensFor(template: Template): Record<string, unknown> {
  const tokens = (template.defaultTokens || {}) as Record<string, unknown>;
  // Clon profundo simple via JSON: defaultTokens es siempre JSON-serializable.
  return JSON.parse(JSON.stringify(tokens));
}
