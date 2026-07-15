import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ApifyPost {
  caption?: string;
  images?: string[];
  displayUrl?: string;
  timestamp?: string;
  ownerUsername?: string;
  ownerFullName?: string;
}

export interface ApifyRunStatus {
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED' | 'TIMED-OUT' | string;
  datasetId?: string;
}

/**
 * Cliente del actor `apify/instagram-scraper` del marketplace (nada que
 * programar del lado de Apify — solo llamadas REST). Nombres de campos del
 * dataset verificados contra la doc publica del actor al escribir esto;
 * confirmar con una corrida real contra una cuenta de prueba antes de dar
 * por cerrada la Fase I4 del plan (docs/plan-instagram-import.md).
 */
@Injectable()
export class ApifyInstagramClient {
  private readonly logger = new Logger(ApifyInstagramClient.name);
  private readonly token: string;
  private readonly actorId: string;
  private readonly baseUrl = 'https://api.apify.com/v2';

  constructor(private readonly configService: ConfigService) {
    this.token = this.configService.get<string>('instagramImport.apifyToken') || '';
    this.actorId =
      this.configService.get<string>('instagramImport.apifyActorId') ||
      'apify~instagram-scraper';
  }

  async startRun(handle: string, resultsLimit: number): Promise<{ runId: string }> {
    if (!this.token) {
      throw new Error('APIFY_TOKEN no configurado');
    }
    const res = await fetch(
      `${this.baseUrl}/acts/${this.actorId}/runs?token=${encodeURIComponent(this.token)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          directUrls: [`https://www.instagram.com/${handle}/`],
          resultsLimit,
        }),
      },
    );
    if (!res.ok) {
      throw new Error(`Apify startRun fallo: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { data: { id: string } };
    return { runId: json.data.id };
  }

  async getRunStatus(runId: string): Promise<ApifyRunStatus> {
    const res = await fetch(
      `${this.baseUrl}/actor-runs/${runId}?token=${encodeURIComponent(this.token)}`,
    );
    if (!res.ok) {
      throw new Error(`Apify getRunStatus fallo: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      data: { status: string; defaultDatasetId?: string };
    };
    return { status: json.data.status, datasetId: json.data.defaultDatasetId };
  }

  async getDatasetItems(datasetId: string): Promise<ApifyPost[]> {
    const res = await fetch(
      `${this.baseUrl}/datasets/${datasetId}/items?token=${encodeURIComponent(this.token)}`,
    );
    if (!res.ok) {
      throw new Error(`Apify getDatasetItems fallo: ${res.status} ${await res.text()}`);
    }
    const items = (await res.json()) as Record<string, unknown>[];
    return items.map((item) => this.mapItem(item));
  }

  private mapItem(item: Record<string, unknown>): ApifyPost {
    // Defensivo: distintas versiones del actor nombran los campos distinto.
    const images =
      (item.images as string[] | undefined) ??
      (item.childPosts as { displayUrl?: string }[] | undefined)
        ?.map((c) => c.displayUrl)
        .filter((u): u is string => Boolean(u));
    return {
      caption: (item.caption as string) ?? undefined,
      images: images && images.length > 0 ? images : undefined,
      displayUrl: (item.displayUrl as string) ?? undefined,
      timestamp: (item.timestamp as string) ?? undefined,
      ownerUsername: (item.ownerUsername as string) ?? undefined,
      ownerFullName: (item.ownerFullName as string) ?? undefined,
    };
  }
}
