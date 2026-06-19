import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import * as sharp from 'sharp';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { Store } from '@/modules/stores/domain/entities/store.entity';
import { IStorageService } from '@/infrastructure/storage/storage.interface';
import { resolvePublicStore } from '../services/resolve-public-store.helper';

export interface OgImageResult {
  buffer: Buffer;
  cached: boolean;
}

/**
 * Simple in-memory LRU fallback when R2/S3 is not configured.
 */
class InMemoryOgCache {
  private static readonly MAX = 100;
  private static readonly TTL_MS = 24 * 60 * 60 * 1000;
  private readonly store = new Map<string, { buffer: Buffer; expiresAt: number }>();

  get(key: string): Buffer | null {
    const hit = this.store.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // refresh LRU ordering
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.buffer;
  }

  set(key: string, buffer: Buffer) {
    if (this.store.size >= InMemoryOgCache.MAX) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, { buffer, expiresAt: Date.now() + InMemoryOgCache.TTL_MS });
  }
}

@Injectable()
export class GenerateStoreOgUseCase {
  private static readonly WIDTH = 1200;
  private static readonly HEIGHT = 630;
  private static readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  private readonly logger = new Logger(GenerateStoreOgUseCase.name);
  private readonly memoryCache = new InMemoryOgCache();

  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.STORAGE_SERVICE)
    private readonly storage: IStorageService,
    private readonly configService: ConfigService,
  ) {}

  async execute(slug: string): Promise<OgImageResult> {
    // BE-122: resolve via slug or verified custom domain
    const store = await resolvePublicStore(this.storeRepository, slug);
    if (!store) throw new NotFoundException('Store not found');

    const cacheKey = this.buildCacheKey(store);

    // 1. Try cache (R2 if configured, otherwise in-memory)
    const cached = await this.readFromCache(cacheKey);
    if (cached) return { buffer: cached, cached: true };

    // 2. Generate
    const buffer = await this.render(store);

    // 3. Write-through cache (fire-and-forget)
    this.writeToCache(cacheKey, buffer).catch((err) =>
      this.logger.warn(`OG cache write failed: ${err?.message ?? err}`),
    );

    return { buffer, cached: false };
  }

  private buildCacheKey(store: Store): string {
    const fingerprint = crypto
      .createHash('sha1')
      .update(
        JSON.stringify({
          name: store.name,
          tagline: store.description ?? '',
          logo: store.logo ?? '',
        }),
      )
      .digest('hex')
      .slice(0, 16);
    return `og/${store.id}/${fingerprint}.png`;
  }

  private async readFromCache(key: string): Promise<Buffer | null> {
    if (!this.isR2Configured()) {
      return this.memoryCache.get(key);
    }

    try {
      // signed URL + fetch would require network; skip read for simplicity and rely on memory
      // R2 acts as a long-term store; the fresh fetch path uses HTTP cache headers.
      // For simplicity, we check memory cache too so repeated hits in-process are cheap.
      return this.memoryCache.get(key);
    } catch {
      return null;
    }
  }

  private async writeToCache(key: string, buffer: Buffer): Promise<void> {
    this.memoryCache.set(key, buffer);

    if (!this.isR2Configured()) return;

    try {
      await this.storage.upload(buffer, key, 'image/png');
    } catch (err) {
      throw err;
    }
  }

  private isR2Configured(): boolean {
    const bucket = this.configService.get<string>('storage.aws.bucketName');
    const accessKey = this.configService.get<string>('storage.aws.accessKeyId');
    return Boolean(bucket && accessKey);
  }

  private async render(store: Store): Promise<Buffer> {
    const { WIDTH, HEIGHT } = GenerateStoreOgUseCase;

    const primary = this.sanitizeColor(store.primaryColor) || '#14b8a6';
    const secondary = this.sanitizeColor(store.secondaryColor) || '#fb7185';
    const bg = this.sanitizeColor(store.backgroundColor) || '#ffffff';

    const name = this.escapeSvg(this.truncate(store.name, 48));
    const tagline = this.escapeSvg(this.truncate(store.description ?? 'Hecho con ByLink', 100));

    const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="${primary}"/>
  <text x="80" y="280" font-family="system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif" font-size="88" font-weight="800" fill="${primary}">${name}</text>
  <text x="80" y="380" font-family="system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif" font-size="36" font-weight="400" fill="#334155">${tagline}</text>
  <text x="80" y="${HEIGHT - 60}" font-family="system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif" font-size="28" font-weight="600" fill="${secondary}">bylink.app/${this.escapeSvg(store.slug)}</text>
</svg>`.trim();

    const svgBuffer = Buffer.from(svg);
    let pipeline = sharp(svgBuffer);

    if (store.logo) {
      try {
        const logoBuffer = await this.fetchLogo(store.logo);
        if (logoBuffer) {
          const resizedLogo = await sharp(logoBuffer)
            .resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
          pipeline = pipeline.composite([{ input: resizedLogo, top: 80, left: WIDTH - 240 }]);
        }
      } catch (err) {
        this.logger.debug(`Skipping OG logo overlay: ${(err as Error)?.message ?? err}`);
      }
    }

    return pipeline.png().toBuffer();
  }

  private async fetchLogo(url: string): Promise<Buffer | null> {
    if (!/^https?:\/\//i.test(url)) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      return Buffer.from(arr);
    } catch {
      return null;
    }
  }

  private sanitizeColor(value: string | null | undefined): string | null {
    if (!value) return null;
    return /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : null;
  }

  private escapeSvg(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
  }
}
