import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '@prisma/client';

/**
 * BE-127 — Item minimo para el switcher del panel.
 * Devuelto por GET /users/me/stores y POST /users/me/stores/switch.
 */
export class StoreItemDto {
  @ApiProperty({ example: 'cluvxx0001' })
  id: string;

  @ApiProperty({ example: 'mi-tienda' })
  slug: string;

  @ApiProperty({ example: 'Mi Tienda' })
  name: string;

  @ApiProperty({ required: false, nullable: true, example: 'https://cdn.bylink.app/.../logo.png' })
  logo: string | null;

  @ApiProperty({ enum: Plan, required: false, nullable: true, example: 'FREE' })
  plan: Plan | null;

  @ApiProperty({ example: true })
  isActive: boolean;
}
