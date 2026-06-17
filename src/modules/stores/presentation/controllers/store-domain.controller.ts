import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { RegisterDomainUseCase } from '../../application/use-cases/domain/register-domain.use-case';
import { GetDomainUseCase } from '../../application/use-cases/domain/get-domain.use-case';
import { VerifyDomainUseCase } from '../../application/use-cases/domain/verify-domain.use-case';
import { DeleteDomainUseCase } from '../../application/use-cases/domain/delete-domain.use-case';
import {
  RegisterStoreDomainDto,
  StoreDomainResponseDto,
} from '../../application/dto/store-domain.dto';

@ApiTags('Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/domain')
export class StoreDomainController {
  constructor(
    private readonly registerDomain: RegisterDomainUseCase,
    private readonly getDomain: GetDomainUseCase,
    private readonly verifyDomain: VerifyDomainUseCase,
    private readonly deleteDomain: DeleteDomainUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Register or replace the custom domain for a store (PRO/BUSINESS only)',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 201, type: StoreDomainResponseDto })
  @ApiResponse({ status: 403, description: 'Plan does not allow custom domains' })
  @ApiResponse({ status: 409, description: 'Domain already registered by another store' })
  async register(
    @Param('storeId') storeId: string,
    @Body() dto: RegisterStoreDomainDto,
  ): Promise<StoreDomainResponseDto> {
    return this.registerDomain.execute(storeId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get the custom domain configuration for a store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: StoreDomainResponseDto })
  @ApiResponse({ status: 404, description: 'No custom domain configured' })
  async get(@Param('storeId') storeId: string): Promise<StoreDomainResponseDto> {
    return this.getDomain.execute(storeId);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Trigger lazy DNS TXT verification for the configured domain',
    description:
      'Looks up _bylink-verify.<domain> for the verificationToken value. ' +
      'Updates status to VERIFIED or FAILED. No cron — verification only runs when this endpoint is hit.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: StoreDomainResponseDto })
  async verify(@Param('storeId') storeId: string): Promise<StoreDomainResponseDto> {
    return this.verifyDomain.execute(storeId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove the custom domain for a store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 204 })
  async remove(@Param('storeId') storeId: string): Promise<void> {
    return this.deleteDomain.execute(storeId);
  }
}
