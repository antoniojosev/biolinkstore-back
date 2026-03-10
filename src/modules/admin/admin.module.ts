import { Module } from '@nestjs/common';
import { AdminEventsController } from './presentation/controllers/admin-payment-reports.controller';

@Module({
  controllers: [AdminEventsController],
})
export class AdminModule {}
