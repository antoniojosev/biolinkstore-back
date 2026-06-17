import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { StoreDomainStatus } from '@prisma/client';

export class RegisterStoreDomainDto {
  @ApiProperty({ example: 'tienda.example.com' })
  @IsString()
  @MaxLength(253)
  domain!: string;
}

export class StoreDomainResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  domain: string;

  @ApiProperty({ enum: StoreDomainStatus })
  status: StoreDomainStatus;

  @ApiProperty({ description: 'TXT record value the merchant must publish' })
  verificationToken: string;

  @ApiProperty({
    description: 'Host where the TXT record must be published (e.g. _bylink-verify.tienda.example.com)',
  })
  verificationHost: string;

  @ApiProperty({ required: false, nullable: true })
  verifiedAt: Date | null;

  @ApiProperty({ required: false, nullable: true })
  lastCheckedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
