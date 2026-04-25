import { PalettePreset } from '../entities/palette-preset.entity';

export interface IPalettePresetRepository {
  findActive(): Promise<PalettePreset[]>;
}
