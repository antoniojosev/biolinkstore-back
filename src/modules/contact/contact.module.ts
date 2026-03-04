import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactUseCase } from './contact.use-case';

@Module({
  controllers: [ContactController],
  providers: [ContactUseCase],
})
export class ContactModule {}
