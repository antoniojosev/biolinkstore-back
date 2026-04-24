import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { AdminEventsController } from './presentation/controllers/admin-payment-reports.controller';
import { AdminSlugMissesController } from './presentation/controllers/admin-slug-misses.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminEventsController, AdminSlugMissesController],
})
export class AdminModule {}
