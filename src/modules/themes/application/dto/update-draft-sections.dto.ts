import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayMinSize } from 'class-validator';

/**
 * Body del PATCH /stores/:storeId/theme/draft/sections.
 *
 * El validador detallado de cada sección vive en `SectionSchemaValidator`
 * (lectura del sectionSchema del template activo). Aquí solo validamos
 * que `sections` sea un array.
 */
export class UpdateDraftSectionsDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description:
      'Árbol completo de secciones (replace, no merge). Cada sección: { type, key, visible, variant?, props }.',
  })
  @IsArray()
  @ArrayMinSize(0)
  sections: unknown[];
}
