import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

const ALLOWED_FONTS = [
  'Inter',
  'Playfair Display',
  'Fraunces',
  'Source Serif 4',
  'Manrope',
  'Space Grotesk',
  'Poppins',
  'Lora',
];

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Palette del draft. Lenient: cualquier prop dentro del objeto que no esté en
 * { preset, primary, secondary, accent, bg, surface, text, muted, border }
 * se acepta y persiste tal cual (frontend puede agregar tokens custom).
 *
 * Validación dura: si una de las claves estándar viene presente, debe ser hex válido.
 */
export class PaletteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  preset?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'primary debe ser hex #RRGGBB' })
  primary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'secondary debe ser hex #RRGGBB' })
  secondary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'accent debe ser hex #RRGGBB' })
  accent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'bg debe ser hex #RRGGBB' })
  bg?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'surface debe ser hex #RRGGBB' })
  surface?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'text debe ser hex #RRGGBB' })
  text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'muted debe ser hex #RRGGBB' })
  muted?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(HEX_COLOR_REGEX, { message: 'border debe ser hex #RRGGBB' })
  border?: string;
}

export class TypographyDto {
  @ApiPropertyOptional({ enum: ALLOWED_FONTS })
  @IsOptional()
  @IsIn(ALLOWED_FONTS, {
    message: `headingFont debe ser uno de: ${ALLOWED_FONTS.join(', ')}`,
  })
  headingFont?: string;

  @ApiPropertyOptional({ enum: ALLOWED_FONTS })
  @IsOptional()
  @IsIn(ALLOWED_FONTS, {
    message: `bodyFont debe ser uno de: ${ALLOWED_FONTS.join(', ')}`,
  })
  bodyFont?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scale?: string;
}

export class UpdateDraftTokensBodyDto {
  @ApiPropertyOptional({ type: () => PaletteDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PaletteDto)
  palette?: PaletteDto;

  @ApiPropertyOptional({ type: () => TypographyDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TypographyDto)
  typography?: TypographyDto;

  @ApiPropertyOptional({ enum: ['sm', 'md', 'lg', 'xl'] })
  @IsOptional()
  @IsIn(['sm', 'md', 'lg', 'xl'], {
    message: 'radius debe ser uno de: sm, md, lg, xl',
  })
  radius?: string;

  @ApiPropertyOptional({ enum: ['compact', 'normal', 'comfortable'] })
  @IsOptional()
  @IsIn(['compact', 'normal', 'comfortable'], {
    message: 'spacing debe ser uno de: compact, normal, comfortable',
  })
  spacing?: string;

  @ApiPropertyOptional({ enum: ['solid', 'outline', 'ghost'] })
  @IsOptional()
  @IsIn(['solid', 'outline', 'ghost'], {
    message: 'buttonStyle debe ser uno de: solid, outline, ghost',
  })
  buttonStyle?: string;
}

export class UpdateDraftTokensDto {
  @ApiProperty({ type: () => UpdateDraftTokensBodyDto })
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateDraftTokensBodyDto)
  tokens: UpdateDraftTokensBodyDto;
}

