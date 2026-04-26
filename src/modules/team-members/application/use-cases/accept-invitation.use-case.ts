import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreInvitationRepository } from '../../domain/repositories/store-invitation.repository.interface';
import { IStoreMemberRepository } from '../../domain/repositories/store-member.repository.interface';
import { IUserRepository } from '@/modules/users/domain/repositories/user.repository.interface';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { AcceptInvitationResponseDto } from '../dto/team-member.dto';
import { validateTeamLimit } from '../helpers/team-limits.helper';

@Injectable()
export class AcceptInvitationUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_INVITATION_REPOSITORY)
    private readonly invitationRepo: IStoreInvitationRepository,
    @Inject(INJECTION_TOKENS.STORE_MEMBER_REPOSITORY)
    private readonly memberRepo: IStoreMemberRepository,
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepo: IStoreRepository,
  ) {}

  async execute(token: string, actorUserId: string): Promise<AcceptInvitationResponseDto> {
    const invitation = await this.invitationRepo.findByToken(token);
    if (!invitation) throw new NotFoundException('Invitation not found');

    if (invitation.acceptedAt) throw new ConflictException('Invitation already accepted');
    if (invitation.declinedAt) throw new ConflictException('Invitation already declined');
    if (invitation.expiresAt <= new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    const user = await this.userRepo.findById(actorUserId);
    if (!user) throw new NotFoundException('User not found');

    if (user.email.toLowerCase().trim() !== invitation.email.toLowerCase().trim()) {
      throw new ForbiddenException(
        `Esta invitacion es para ${invitation.email}. Inicia sesion con ese email para aceptarla.`,
      );
    }

    const existing = await this.memberRepo.findByStoreAndUser(invitation.storeId, actorUserId);
    if (existing) {
      throw new ConflictException('Ya eres miembro de esta tienda');
    }

    const store = await this.storeRepo.findByIdWithSubscription(invitation.storeId);
    if (!store) throw new NotFoundException('Store not found');

    const plan = store.subscription?.plan ?? 'FREE';
    const currentCount = await this.memberRepo.countByStoreId(invitation.storeId);
    validateTeamLimit(plan, currentCount);

    const member = await this.memberRepo.create({
      storeId: invitation.storeId,
      userId: actorUserId,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
    });

    const accepted = await this.invitationRepo.markAccepted(invitation.id);

    return {
      invitation: {
        id: accepted.id,
        storeId: accepted.storeId,
        email: accepted.email,
        role: accepted.role,
        expiresAt: accepted.expiresAt,
        acceptedAt: accepted.acceptedAt,
        declinedAt: accepted.declinedAt,
        store: accepted.store,
        inviter: accepted.inviter,
        createdAt: accepted.createdAt,
      },
      member: {
        id: member.id,
        storeId: member.storeId,
        userId: member.userId,
        role: member.role,
        invitedBy: member.invitedBy,
        joinedAt: member.joinedAt,
        user: member.user,
      },
    };
  }
}
