import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SwitchTemplateDto {
  @ApiProperty({ description: 'Key del template al que se cambia el draft activo.' })
  @IsString()
  @IsNotEmpty()
  templateKey: string;
}
