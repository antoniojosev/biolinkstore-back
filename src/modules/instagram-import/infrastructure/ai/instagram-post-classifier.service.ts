import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

export interface PostClassification {
  isProduct: boolean;
  name: string;
  price: number | null;
  currency: 'USD' | 'VES' | null;
  description: string;
  confidence: number;
}

const CLASSIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    isProduct: {
      type: 'boolean',
      description: 'true si el post muestra un producto a la venta (no un meme, foto personal, flyer de promo, etc.)',
    },
    name: { type: 'string', description: 'Nombre corto del producto, en español' },
    price: { type: ['number', 'null'], description: 'Precio detectado en el caption o en la imagen, o null si no hay' },
    currency: { type: ['string', 'null'], enum: ['USD', 'VES', null] },
    description: { type: 'string', description: 'Descripcion corta a partir del caption' },
    confidence: { type: 'number', description: '0 a 1, que tan seguro estas de que isProduct es correcto' },
  },
  required: ['isProduct', 'name', 'price', 'currency', 'description', 'confidence'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `Sos un clasificador para un importador de catalogo desde Instagram de un vendedor venezolano.
Por cada post (imagen + caption) decidis si es un PRODUCTO A LA VENTA (ropa, comida, accesorios, servicios con precio) o
NO lo es (meme, foto personal, flyer de promocion sin producto especifico, foto de otra persona, etc.).
Si es producto, extrae nombre, precio (numero, sin simbolo), moneda (USD o VES — si el caption dice "Bs" es VES, si dice
"$" es USD, si no hay simbolo asumi USD) y una descripcion corta. Los captions suelen mezclar nombre+precio+descripcion
en una sola frase con emojis — separalos vos.`;

@Injectable()
export class InstagramPostClassifierService {
  private readonly logger = new Logger(InstagramPostClassifierService.name);
  private readonly client: Anthropic | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('instagramImport.anthropicApiKey');
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async classify(
    imageBuffer: Buffer,
    mimeType: string,
    caption: string,
  ): Promise<PostClassification | null> {
    if (!this.client) {
      this.logger.warn('ANTHROPIC_API_KEY no configurado — no se puede clasificar');
      return null;
    }
    const mediaType = this.normalizeMediaType(mimeType);
    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        output_config: {
          format: { type: 'json_schema', schema: CLASSIFICATION_SCHEMA },
        },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: imageBuffer.toString('base64') },
              },
              { type: 'text', text: `Caption: ${caption || '(sin caption)'}` },
            ],
          },
        ],
      });
      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') return null;
      return JSON.parse(textBlock.text) as PostClassification;
    } catch (err) {
      this.logger.warn(`Clasificacion fallo para un post: ${(err as Error).message}`);
      return null;
    }
  }

  private normalizeMediaType(mimeType: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
    if (mimeType === 'image/png' || mimeType === 'image/gif' || mimeType === 'image/webp') {
      return mimeType;
    }
    return 'image/jpeg';
  }
}
