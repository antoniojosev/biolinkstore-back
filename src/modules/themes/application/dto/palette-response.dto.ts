import { ApiProperty } from '@nestjs/swagger';

export class PaletteResponseDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    description: 'Tokens de color: { primary, secondary, accent, bg, surface, text, muted, border }',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  colors: unknown;

  @ApiProperty()
  sortOrder: number;
}
