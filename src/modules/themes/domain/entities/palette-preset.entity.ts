export class PalettePreset {
  id: string;
  key: string;
  name: string;
  colorsJson: unknown;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PalettePreset>) {
    Object.assign(this, partial);
  }
}
