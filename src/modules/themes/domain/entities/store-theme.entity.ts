export class StoreTheme {
  id: string;
  storeId: string;

  activeTemplate: string;
  publishedTemplate: string | null;
  rollbackTemplate: string | null;

  draftsByTemplate: unknown;
  publishedTree: unknown;
  publishedTokens: unknown;
  rollbackTree: unknown;
  rollbackTokens: unknown;

  version: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StoreTheme>) {
    Object.assign(this, partial);
  }
}
