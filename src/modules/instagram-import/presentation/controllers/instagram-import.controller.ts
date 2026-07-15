import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { GetInstagramImportStatusUseCase } from '../../application/use-cases/get-instagram-import-status.use-case';
import { InstagramImportStatusDto } from '../../application/dto/instagram-import-status.dto';

@ApiTags('Instagram Import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/instagram-import')
export class InstagramImportController {
  constructor(private readonly getStatusUseCase: GetInstagramImportStatusUseCase) {}

  @Get('latest')
  @ApiOperation({
    summary:
      'Estado del ultimo import de Instagram (o el activo) — el banner/animacion del dashboard hace polling de esto.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: InstagramImportStatusDto })
  async getLatest(@Param('storeId') storeId: string): Promise<InstagramImportStatusDto> {
    const status = await this.getStatusUseCase.execute(storeId);
    if (!status) {
      throw new NotFoundException('Esta tienda todavia no pidio ningun import de Instagram');
    }
    return status;
  }
}
