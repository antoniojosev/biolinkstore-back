/**
 * ThemeVersionMigrator — BE-120c.
 *
 * Migrador idempotente del `publishedTree` de un StoreTheme contra la versión
 * actual del `Template` (sectionSchema). Aplicado lazy en el GET público.
 *
 * Reglas:
 *   - Si `tree.templateVersion === template.version` → no-op, migrated=false.
 *   - Para cada sección en tree.sections:
 *       - Si `section.type` ya no existe en sectionSchema.sections → drop sección.
 *       - Para sus props, drop las que ya no están declaradas en el schema.
 *       - Si el SectionDef declara `defaults` (Record<string, unknown>), agrega
 *         las keys de `defaults` que aún no estén presentes en `props`.
 *   - Bumpea `templateVersion` al actual del template.
 *   - Solo upgrades: si `tree.templateVersion > template.version` (caso raro:
 *     downgrade del catalog), respetamos el tree tal cual; bumpeo se omite y
 *     migrated=false. Esto previene corrupción si se hace un rollback de seed.
 *
 * Pure function. NO escribe a DB. NO muta el input.
 */

import { Template } from '../../domain/entities/template.entity';

export interface MigratorTreeSection {
  type: string;
  key: string;
  visible?: boolean;
  variant?: string;
  props?: Record<string, unknown>;
  [k: string]: unknown;
}

export interface MigratorTree {
  template: string;
  templateVersion: number;
  sections: MigratorTreeSection[];
  [k: string]: unknown;
}

export interface MigratorSectionDef {
  type: string;
  key: string;
  props?: Record<string, unknown>;
  defaults?: Record<string, unknown>;
}

export interface MigratorSchema {
  defaultOrder?: string[];
  sections?: MigratorSectionDef[];
}

export interface MigrationOutput {
  tree: MigratorTree;
  migrated: boolean;
}

/**
 * Aplica la migración idempotente del tree a la versión actual del template.
 *
 * @param tree Árbol de secciones publicado (clon-safe; no se muta).
 * @param template Template con sectionSchema y version actuales del catálogo.
 */
export function migrateTreeToCurrentVersion(
  tree: MigratorTree,
  template: Template,
): MigrationOutput {
  if (!tree || typeof tree !== 'object' || !Array.isArray(tree.sections)) {
    // Tree corrupto: devolvemos tal cual; el cliente decidirá fallback.
    return { tree, migrated: false };
  }

  const currentVersion = template.version;
  const treeVersion =
    typeof tree.templateVersion === 'number' ? tree.templateVersion : 0;

  // Solo upgrades. Si el tree va por delante del catálogo, no tocamos.
  if (treeVersion >= currentVersion) {
    return { tree, migrated: false };
  }

  const schema = (template.sectionSchema || {}) as MigratorSchema;
  const sectionDefs = Array.isArray(schema.sections) ? schema.sections : [];

  // Index por type para lookup O(1).
  const defByType = new Map<string, MigratorSectionDef>();
  for (const def of sectionDefs) {
    if (def && typeof def.type === 'string') {
      defByType.set(def.type, def);
    }
  }

  const migratedSections: MigratorTreeSection[] = [];
  for (const section of tree.sections) {
    if (!section || typeof section !== 'object') continue;
    if (typeof section.type !== 'string' || typeof section.key !== 'string') {
      continue;
    }

    const def = defByType.get(section.type);
    if (!def) {
      // Tipo dropeado del schema → drop sección.
      continue;
    }

    const declaredPropDefs = (def.props || {}) as Record<string, unknown>;
    const declaredDefaults = (def.defaults || {}) as Record<string, unknown>;
    const declaredKeys = new Set(Object.keys(declaredPropDefs));

    const sourceProps =
      section.props && typeof section.props === 'object' && !Array.isArray(section.props)
        ? (section.props as Record<string, unknown>)
        : {};

    const newProps: Record<string, unknown> = {};

    // Mantener solo las props declaradas en el schema actual.
    for (const k of Object.keys(sourceProps)) {
      if (declaredKeys.has(k)) {
        newProps[k] = sourceProps[k];
      }
    }

    // Agregar defaults declarados que no estén ya seteados.
    for (const k of Object.keys(declaredDefaults)) {
      if (!(k in newProps) && declaredKeys.has(k)) {
        newProps[k] = declaredDefaults[k];
      }
    }

    const migratedSection: MigratorTreeSection = {
      type: section.type,
      key: section.key,
      visible: typeof section.visible === 'boolean' ? section.visible : true,
      props: newProps,
    };
    if (typeof section.variant === 'string') {
      migratedSection.variant = section.variant;
    }
    migratedSections.push(migratedSection);
  }

  return {
    tree: {
      ...tree,
      templateVersion: currentVersion,
      sections: migratedSections,
    },
    migrated: true,
  };
}
