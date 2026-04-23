import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { CreateCustomRateUseCase } from '../../application/use-cases/create-custom-rate.use-case';
import { UpdateCustomRateUseCase } from '../../application/use-cases/update-custom-rate.use-case';
import { ListCustomRatesUseCase } from '../../application/use-cases/list-custom-rates.use-case';
import { DeleteCustomRateUseCase } from '../../application/use-cases/delete-custom-rate.use-case';
import {
  CreateCustomRateDto,
  UpdateCustomRateDto,
  CustomRateResponseDto,
} from '../../application/dto/custom-rate.dto';
import { StoreCustomRate } from '../../domain/entities/rate.entity';

function toResponse(r: StoreCustomRate): CustomRateResponseDto {
  return {
    id: r.id,
    label: r.label,
    baseCurrency: r.baseCurrency,
    mode: r.mode as CustomRateResponseDto['mode'],
    valueVes: r.valueVes,
    formula: r.formula,
    sourceUrl: r.sourceUrl,
    sourcePath: r.sourcePath,
    resolvedValue: null,
    resolvedAt: null,
  };
}

@ApiTags('Custom Rates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/custom-rates')
export class CustomRatesController {
  constructor(
    private readonly createUseCase: CreateCustomRateUseCase,
    private readonly updateUseCase: UpdateCustomRateUseCase,
    private readonly listUseCase: ListCustomRatesUseCase,
    private readonly deleteUseCase: DeleteCustomRateUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List custom rates for a store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: [CustomRateResponseDto] })
  async list(@Param('storeId') storeId: string): Promise<CustomRateResponseDto[]> {
    return this.listUseCase.execute(storeId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom rate' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 201, type: CustomRateResponseDto })
  async create(
    @Param('storeId') storeId: string,
    @Body() dto: CreateCustomRateDto,
  ): Promise<CustomRateResponseDto> {
    const created = await this.createUseCase.execute(storeId, dto);
    return toResponse(created);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a custom rate' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, type: CustomRateResponseDto })
  async update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomRateDto,
  ): Promise<CustomRateResponseDto> {
    const updated = await this.updateUseCase.execute(storeId, id, dto);
    return toResponse(updated);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a custom rate' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.deleteUseCase.execute(storeId, id);
  }
}
