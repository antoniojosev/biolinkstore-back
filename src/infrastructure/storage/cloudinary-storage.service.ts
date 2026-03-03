import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { IStorageService } from './storage.interface';

@Injectable()
export class CloudinaryStorageService implements IStorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('storage.cloudinary.cloudName'),
      api_key: this.configService.get<string>('storage.cloudinary.apiKey'),
      api_secret: this.configService.get<string>('storage.cloudinary.apiSecret'),
    });
  }

  async upload(file: Buffer, key: string, mimeType: string): Promise<string> {
    const isPdf = mimeType === 'application/pdf';
    const resourceType = isPdf ? 'raw' : 'image';
    // Use key without extension as public_id, replace slashes for folder structure
    const publicId = key.replace(/\.[^.]+$/, '');

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            public_id: publicId,
            resource_type: resourceType,
            overwrite: true,
          },
          (error, result) => {
            if (error || !result) {
              this.logger.error('Cloudinary upload failed', error);
              reject(error ?? new Error('Upload returned no result'));
            } else {
              resolve(result);
            }
          },
        )
        .end(file);
    });

    return result.secure_url;
  }

  async delete(key: string): Promise<void> {
    const publicId = key.replace(/\.[^.]+$/, '');
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.error(`Cloudinary delete failed for ${publicId}`, error);
    }
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const publicId = key.replace(/\.[^.]+$/, '');
    return cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      type: 'authenticated',
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    });
  }
}
