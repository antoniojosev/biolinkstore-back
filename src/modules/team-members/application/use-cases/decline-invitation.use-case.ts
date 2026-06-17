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
import { IUserRepository } from '@/modules/users/domain/repositories/user.repository.interface';

@Injectable()
export class DeclineInvitationUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_INVITATION_REPOSITORY)
    private readonly invitationRepo: IStoreInvitationRepository,
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(token: string, actorUserId: string): Promise<void> {
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
      throw new ForbiddenException('Esta invitacion no es para tu email');
    }

    await this.invitationRepo.markDeclined(invitation.id);
  }
}
