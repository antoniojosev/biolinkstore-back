import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreInvitationRepository } from '../../domain/repositories/store-invitation.repository.interface';
import { IUserRepository } from '@/modules/users/domain/repositories/user.repository.interface';
import { StoreInvitationResponseDto } from '../dto/team-member.dto';

@Injectable()
export class GetInvitationByTokenUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_INVITATION_REPOSITORY)
    private readonly invitationRepo: IStoreInvitationRepository,
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(token: string, actorUserId: string): Promise<StoreInvitationResponseDto> {
    const invitation = await this.invitationRepo.findByToken(token);
    if (!invitation) throw new NotFoundException('Invitation not found');

    const user = await this.userRepo.findById(actorUserId);
    if (!user) throw new NotFoundException('User not found');

    if (user.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
      throw new ForbiddenException(
        `Esta invitacion es para ${invitation.email}. Inicia sesion con ese email para verla.`,
      );
    }

    return {
      id: invitation.id,
      storeId: invitation.storeId,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      declinedAt: invitation.declinedAt,
      store: invitation.store,
      inviter: invitation.inviter,
      createdAt: invitation.createdAt,
    };
  }
}
