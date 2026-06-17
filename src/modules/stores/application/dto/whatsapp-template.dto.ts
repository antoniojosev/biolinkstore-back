import { IsString, IsOptional, MaxLength, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MAX_WHATSAPP_TEMPLATE_LENGTH } from '../../domain/services/whatsapp-template.engine';

export class UpdateWhatsappTemplateDto {
  @ApiProperty({
    description: 'Template string. Pass null to reset to default.',
    required: false,
    nullable: true,
    maxLength: MAX_WHATSAPP_TEMPLATE_LENGTH,
  })
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(MAX_WHATSAPP_TEMPLATE_LENGTH)
  template: string | null;
}

export class PreviewWhatsappTemplateDto {
  @ApiProperty({ maxLength: MAX_WHATSAPP_TEMPLATE_LENGTH })
  @IsString()
  @MaxLength(MAX_WHATSAPP_TEMPLATE_LENGTH)
  template: string;
}

export class WhatsappTemplateResponseDto {
  @ApiProperty()
  template: string;

  @ApiProperty({ description: 'True when store has no custom template and default is returned.' })
  isDefault: boolean;

  @ApiProperty({ description: 'Plan permite editar el template (FREE=false, PRO/BUSINESS=true).' })
  canEdit: boolean;

  @ApiProperty({
    description: 'List of supported root and item variables.',
  })
  supportedVariables: {
    root: readonly string[];
    item: readonly string[];
  };
}

export class PreviewWhatsappTemplateResponseDto {
  @ApiProperty()
  rendered: string;

  @ApiProperty({ type: [String] })
  errors: string[];
}
