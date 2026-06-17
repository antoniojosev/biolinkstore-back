import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DraftSummaryDto {
  @ApiProperty()
  template: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt: string;
}

export class DraftFullDto {
  @ApiProperty()
  template: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  tree: unknown;

  @ApiProperty({ type: 'object', additionalProperties: true })
  tokens: unknown;
}

export class StoreThemeResponseDto {
  @ApiProperty()
  activeTemplate: string;

  @ApiPropertyOptional({ nullable: true })
  publishedTemplate: string | null;

  @ApiPropertyOptional({ nullable: true })
  rollbackTemplate: string | null;

  @ApiProperty()
  version: number;

  @ApiPropertyOptional({ nullable: true, type: 'string', format: 'date-time' })
  publishedAt: string | null;

  @ApiProperty({ type: () => DraftFullDto })
  draft: DraftFullDto;

  @ApiProperty({ type: () => DraftSummaryDto, isArray: true })
  drafts: DraftSummaryDto[];

  @ApiPropertyOptional({ nullable: true, type: () => DraftFullDto })
  published: DraftFullDto | null;

  @ApiPropertyOptional({ nullable: true, type: () => DraftFullDto })
  rollback: DraftFullDto | null;
}
