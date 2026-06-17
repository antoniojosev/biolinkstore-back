import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IPalettePresetRepository } from '../../domain/repositories/palette-preset.repository.interface';
import { PaletteResponseDto } from '../dto/palette-response.dto';

@Injectable()
export class ListPalettesUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PALETTE_PRESET_REPOSITORY)
    private readonly palettePresetRepository: IPalettePresetRepository,
  ) {}

  async execute(): Promise<PaletteResponseDto[]> {
    const palettes = await this.palettePresetRepository.findActive();

    return palettes.map((palette) => ({
      key: palette.key,
      name: palette.name,
      colors: palette.colorsJson,
      sortOrder: palette.sortOrder,
    }));
  }
}
