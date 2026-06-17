import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreMemberRepository } from '../../domain/repositories/store-member.repository.interface';

@Injectable()
export class RemoveMemberUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_MEMBER_REPOSITORY)
    private readonly memberRepo: IStoreMemberRepository,
  ) {}

  /**
   * Remueve un miembro del store. Permitido si:
   *   - actorRole es OWNER o ADMIN, o
   *   - actorUserId === target.userId (auto-leave)
   * No permite remover al ultimo OWNER.
   */
  async execute(
    storeId: string,
    memberId: string,
    actorUserId: string,
    actorIsOwnerOrAdmin: boolean,
  ): Promise<void> {
    const member = await this.memberRepo.findById(memberId);
    if (!member || member.storeId !== storeId) {
      throw new NotFoundException('Member not found in this store');
    }

    const isSelfLeave = member.userId === actorUserId;
    if (!actorIsOwnerOrAdmin && !isSelfLeave) {
      throw new ForbiddenException('No tienes permiso para remover a este miembro');
    }

    if (member.role === 'OWNER') {
      const ownerCount = await this.memberRepo.countOwnersByStoreId(storeId);
      if (ownerCount <= 1) {
        throw new ConflictException(
          'No puedes remover al ultimo OWNER. Promueve a otro miembro a OWNER primero o borra la tienda.',
        );
      }
    }

    await this.memberRepo.delete(memberId);
  }
}
