import { ApiProperty } from '@nestjs/swagger';
import { StoreItemDto } from './store-item.dto';

/**
 * BE-127 — Response de POST /users/me/stores/switch.
 */
export class SwitchStoreResponseDto {
  @ApiProperty({ example: 'cluvxx0001' })
  activeStoreId: string;

  @ApiProperty({ type: StoreItemDto })
  store: StoreItemDto;
}
