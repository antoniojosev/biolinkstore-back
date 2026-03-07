import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { ContactUseCase } from './contact.use-case';
import { DemoRequestDto } from './dto/demo-request.dto';
import { InquiryDto } from './dto/inquiry.dto';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactUseCase: ContactUseCase) {}

  @Public()
  @Post('demo-request')
  @ApiOperation({ summary: 'Request a personalized demo' })
  @ApiResponse({ status: 201, description: 'Demo request sent successfully' })
  async demoRequest(@Body() dto: DemoRequestDto): Promise<{ message: string }> {
    return this.contactUseCase.sendDemoRequest(dto);
  }

  @Post('inquiry')
  @ApiOperation({ summary: 'Send a design or custom plan inquiry' })
  @ApiResponse({ status: 201, description: 'Inquiry sent successfully' })
  async inquiry(@Body() dto: InquiryDto): Promise<{ message: string }> {
    return this.contactUseCase.sendInquiry(dto);
  }
}
