import {
  Controller,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { UploadFilesUseCase } from '../../application/use-cases/upload-files.use-case';
import { UploadResponseDto } from '../../application/dto/upload-response.dto';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/uploads')
export class UploadsController {
  constructor(private readonly uploadFilesUseCase: UploadFilesUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Upload files for a store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadFiles(
    @Param('storeId') storeId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadResponseDto[]> {
    if (!files?.length) {
      throw new BadRequestException('No se enviaron archivos');
    }
    return this.uploadFilesUseCase.execute(storeId, files);
  }
}
