import { ApiProperty } from '@nestjs/swagger';
import { InstagramImportStatus } from '../../domain/entities/instagram-import.entity';

export class InstagramImportProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  basePrice: number;
}

export class InstagramImportStatusDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['RUNNING', 'PROCESSING', 'DONE', 'FAILED'] })
  status: InstagramImportStatus;

  @ApiProperty()
  handle: string;

  @ApiProperty({ nullable: true })
  profileName: string | null;

  @ApiProperty({ nullable: true })
  profileFollowers: number | null;

  @ApiProperty()
  postsFound: number;

  @ApiProperty()
  postsProcessed: number;

  @ApiProperty()
  postsSkipped: number;

  @ApiProperty()
  productsCreated: number;

  @ApiProperty({ type: [InstagramImportProductDto] })
  products: InstagramImportProductDto[];

  @ApiProperty({ nullable: true })
  error: string | null;

  @ApiProperty()
  requestedAt: Date;

  @ApiProperty({ nullable: true })
  finishedAt: Date | null;
}
