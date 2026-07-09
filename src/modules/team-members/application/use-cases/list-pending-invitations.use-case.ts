import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreInvitationRepository } from '../../domain/repositories/store-invitation.repository.interface';
import { StoreInvitationResponseDto } from '../dto/team-member.dto';

@Injectable()
export class ListPendingInvitationsUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_INVITATION_REPOSITORY)
    private readonly invitationRepo: IStoreInvitationRepository,
  ) {}

  async execute(storeId: string): Promise<StoreInvitationResponseDto[]> {
    const invitations = await this.invitationRepo.findPendingByStoreId(storeId);
    return invitations.map((inv) => ({
      id: inv.id,
      storeId: inv.storeId,
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt,
      acceptedAt: inv.acceptedAt,
      declinedAt: inv.declinedAt,
      store: inv.store,
      inviter: inv.inviter,
      createdAt: inv.createdAt,
    }));
  }
}
