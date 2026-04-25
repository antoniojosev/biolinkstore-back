import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Plan, TemplateNiche } from '@prisma/client';

/**
 * Query params del endpoint `GET /templates`.
 *
 * Importante: el endpoint debe ignorar SILENCIOSAMENTE cualquier query param no declarado
 * aquí (regla del ticket). Por eso en el controller se aplica un `ValidationPipe` local con
 * `forbidNonWhitelisted: false`, override del pipe global del proyecto.
 */
export class ListTemplatesQueryDto {
  @ApiPropertyOptional({ enum: TemplateNiche })
  @IsOptional()
  @IsEnum(TemplateNiche)
  niche?: TemplateNiche;

  @ApiPropertyOptional({
    enum: Plan,
    description:
      'Filtra templates con planRequired <= plan. FREE < PRO < BUSINESS.',
  })
  @IsOptional()
  @IsEnum(Plan)
  plan?: Plan;
}
