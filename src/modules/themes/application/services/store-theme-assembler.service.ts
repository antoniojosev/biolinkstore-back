import { Injectable } from '@nestjs/common';
import { StoreTheme } from '../../domain/entities/store-theme.entity';
import {
  DraftFullDto,
  DraftSummaryDto,
  StoreThemeResponseDto,
} from '../dto/store-theme-response.dto';

/**
 * Ensambla la representación pública del StoreTheme combinando el draft activo,
 * los drafts disponibles, el published y el rollback.
 *
 * Pure: no toca DB, no muta input.
 */
@Injectable()
export class StoreThemeAssembler {
  toResponse(theme: StoreTheme): StoreThemeResponseDto {
    const drafts = theme.draftsByTemplate as Record<
      string,
      { tree: unknown; tokens: unknown; updatedAt: string }
    >;

    const draftEntry = drafts?.[theme.activeTemplate];
    const draft: DraftFullDto = {
      template: theme.activeTemplate,
      tree: draftEntry?.tree ?? null,
      tokens: draftEntry?.tokens ?? null,
    };

    const summaries: DraftSummaryDto[] = drafts
      ? Object.entries(drafts).map(([template, value]) => ({
          template,
          updatedAt:
            value && typeof value.updatedAt === 'string'
              ? value.updatedAt
              : new Date(0).toISOString(),
        }))
      : [];

    const published: DraftFullDto | null =
      theme.publishedTemplate && theme.publishedTree && theme.publishedTokens
        ? {
            template: theme.publishedTemplate,
            tree: theme.publishedTree,
            tokens: theme.publishedTokens,
          }
        : null;

    const rollback: DraftFullDto | null =
      theme.rollbackTemplate && theme.rollbackTree && theme.rollbackTokens
        ? {
            template: theme.rollbackTemplate,
            tree: theme.rollbackTree,
            tokens: theme.rollbackTokens,
          }
        : null;

    return {
      activeTemplate: theme.activeTemplate,
      publishedTemplate: theme.publishedTemplate,
      rollbackTemplate: theme.rollbackTemplate,
      version: theme.version,
      publishedAt: theme.publishedAt ? theme.publishedAt.toISOString() : null,
      draft,
      drafts: summaries,
      published,
      rollback,
    };
  }
}
