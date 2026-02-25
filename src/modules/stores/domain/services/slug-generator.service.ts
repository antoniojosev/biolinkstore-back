import { Injectable, Inject } from '@nestjs/common';
import { generateSlug, generateUniqueSlug } from '@/common/utils/slug.util';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../repositories/store.repository.interface';

@Injectable()
export class SlugGeneratorService {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.storeRepository.checkSlugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
