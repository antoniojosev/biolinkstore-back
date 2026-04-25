import { ApiProperty } from '@nestjs/swagger';
import { StoreItemDto } from './store-item.dto';

/**
 * BE-127 — Response del switcher del panel: lista de stores + indicador
 * de cual esta activa.
 */
export class ListMyStoresResponseDto {
  @ApiProperty({ type: [StoreItemDto] })
  stores: StoreItemDto[];

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Id de la tienda activa para el user. Null cuando el user no tiene tiendas.',
    example: 'cluvxx0001',
  })
  activeStoreId: string | null;
}
