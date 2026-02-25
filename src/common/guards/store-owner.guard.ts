import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '../constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';

@Injectable()
export class StoreOwnerGuard implements CanActivate {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const storeId = request.params.storeId || request.body?.storeId;

    if (!userId || !storeId) {
      throw new ForbiddenException('Missing user or store information');
    }

    const store = await this.storeRepository.findById(storeId);

    if (!store) {
      throw new ForbiddenException('Store not found');
    }

    if (store.ownerId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }

    // Attach store to request for later use
    request.storeId = storeId;

    return true;
  }
}
