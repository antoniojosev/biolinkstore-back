import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class WatermarkService {
  async apply(buffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width ?? 800;
    const height = metadata.height ?? 600;

    const fontSize = Math.max(Math.round(width * 0.06), 16);

    const svg = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .wm {
              font-family: Arial, Helvetica, sans-serif;
              font-size: ${fontSize}px;
              font-weight: bold;
              fill: rgba(255, 255, 255, 0.25);
            }
          </style>
        </defs>
        <text
          x="50%" y="50%"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(-30, ${width / 2}, ${height / 2})"
          class="wm"
        >Bio Link Store</text>
      </svg>
    `);

    return sharp(buffer)
      .composite([{ input: svg, blend: 'over' }])
      .toBuffer();
  }
}
