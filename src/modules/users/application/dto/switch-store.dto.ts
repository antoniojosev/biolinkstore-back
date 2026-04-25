import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * BE-127 — POST /users/me/stores/switch body.
 * `storeId` se valida como string no vacio. La pertenencia al user
 * se valida en el use-case (403 si no le pertenece).
 */
export class SwitchStoreDto {
  @ApiProperty({ example: 'cluvxx0001' })
  @IsString()
  @IsNotEmpty()
  storeId: string;
}
