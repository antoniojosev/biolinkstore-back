import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { S3StorageService } from './s3-storage.service';
import { LocalStorageService } from './local-storage.service';

@Global()
@Module({
  providers: [
    {
      provide: INJECTION_TOKENS.STORAGE_SERVICE,
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('storage.provider');
        if (provider === 's3') {
          return new S3StorageService(configService);
        }
        return new LocalStorageService(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [INJECTION_TOKENS.STORAGE_SERVICE],
})
export class StorageModule {}
