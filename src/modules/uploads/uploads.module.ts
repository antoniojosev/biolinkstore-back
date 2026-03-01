import { Module } from '@nestjs/common';
import { StoresModule } from '@/modules/stores/stores.module';
import { UploadsController } from './presentation/controllers/uploads.controller';
import { UploadFilesUseCase } from './application/use-cases/upload-files.use-case';

@Module({
  imports: [StoresModule],
  controllers: [UploadsController],
  providers: [UploadFilesUseCase],
})
export class UploadsModule {}
