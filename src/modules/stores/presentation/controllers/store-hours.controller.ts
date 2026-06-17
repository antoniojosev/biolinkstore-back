import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { GetStoreHoursUseCase } from '../../application/use-cases/hours/get-store-hours.use-case';
import { UpdateStoreHoursUseCase } from '../../application/use-cases/hours/update-store-hours.use-case';
import { StoreHoursDto, UpdateStoreHoursDto } from '../../application/dto/store-hours.dto';
import { StoreHours } from '../../domain/entities/store-hours.entity';

@ApiTags('Store Hours')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores/:storeId/hours')
export class StoreHoursController {
  constructor(
    private readonly getStoreHoursUseCase: GetStoreHoursUseCase,
    private readonly updateStoreHoursUseCase: UpdateStoreHoursUseCase,
  ) {}

  @Get()
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({ summary: 'Get store hours (lazy creates defaults if missing)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Store hours', type: [StoreHoursDto] })
  async getHours(@Param('storeId') storeId: string): Promise<StoreHours[]> {
    return this.getStoreHoursUseCase.execute(storeId);
  }

  @Put()
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({ summary: 'Bulk update 7-day store hours' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Updated store hours', type: [StoreHoursDto] })
  async updateHours(
    @Param('storeId') storeId: string,
    @Body() dto: UpdateStoreHoursDto,
  ): Promise<StoreHours[]> {
    return this.updateStoreHoursUseCase.execute(storeId, dto);
  }
}
