import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { ContactController } from './contact.controller';
import { ContactUseCase } from './contact.use-case';

@Module({
  imports: [DatabaseModule],
  controllers: [ContactController],
  providers: [ContactUseCase],
})
export class ContactModule {}
