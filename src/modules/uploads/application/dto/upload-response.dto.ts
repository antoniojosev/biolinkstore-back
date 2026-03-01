import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ example: 'http://localhost:3001/uploads/stores/abc/products/uuid.jpg' })
  url: string;

  @ApiProperty({ example: 'stores/abc/products/uuid.jpg' })
  key: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ example: 102400 })
  size: number;
}
