import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { CustomRateMode, StoreCustomRate } from '../../domain/entities/rate.entity';

export const FREE_MAX_CUSTOM_RATES = 1;

/**
 * Valida que el modo pedido y el numero total de custom rates sean permitidos
 * para el plan del store. Tambien valida que los campos requeridos por modo
 * esten presentes.
 */
export function enforcePlanAndModeRules(params: {
  plan: Plan;
  mode: CustomRateMode;
  existing: StoreCustomRate[];
  excludeId?: string;
  hasValueVes: boolean;
  hasFormula: boolean;
  hasSourceUrl: boolean;
  hasSourcePath: boolean;
}): void {
  const { plan, mode, existing, excludeId, hasValueVes, hasFormula, hasSourceUrl, hasSourcePath } =
    params;

  if (plan === Plan.FREE) {
    if (mode !== 'MANUAL') {
      throw new ForbiddenException(
        'El plan FREE solo permite custom rates en modo MANUAL. Actualiza a PRO para formulas y fuentes API.',
      );
    }
    const othersCount = existing.filter((r) => r.id !== excludeId).length;
    if (othersCount >= FREE_MAX_CUSTOM_RATES) {
      throw new ForbiddenException(
        `El plan FREE permite maximo ${FREE_MAX_CUSTOM_RATES} custom rate. Actualiza a PRO para crear mas.`,
      );
    }
  }

  if (mode === 'MANUAL' && !hasValueVes) {
    throw new BadRequestException('MANUAL requiere valueVes');
  }
  if (mode === 'FORMULA' && !hasFormula) {
    throw new BadRequestException('FORMULA requiere formula');
  }
  if (mode === 'API' && (!hasSourceUrl || !hasSourcePath)) {
    throw new BadRequestException('API requiere sourceUrl y sourcePath');
  }
}
