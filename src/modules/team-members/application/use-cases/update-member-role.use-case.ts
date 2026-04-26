import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StoreMemberRole } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreMemberRepository } from '../../domain/repositories/store-member.repository.interface';
import { StoreMemberResponseDto, UpdateMemberRoleDto } from '../dto/team-member.dto';

@Injectable()
export class UpdateMemberRoleUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_MEMBER_REPOSITORY)
    private readonly memberRepo: IStoreMemberRepository,
  ) {}

  async execute(
    storeId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<StoreMemberResponseDto> {
    const member = await this.memberRepo.findById(memberId);
    if (!member || member.storeId !== storeId) {
      throw new NotFoundException('Member not found in this store');
    }

    if (member.role === dto.role) {
      throw new BadRequestException('Member already has this role');
    }

    // Si bajamos a un OWNER de rol, verificar que no sea el ultimo OWNER.
    if (member.role === 'OWNER' && dto.role !== ('OWNER' as StoreMemberRole)) {
      const ownerCount = await this.memberRepo.countOwnersByStoreId(storeId);
      if (ownerCount <= 1) {
        throw new ConflictException(
          'No puedes bajar de rol al ultimo OWNER. Promueve a otro miembro a OWNER primero.',
        );
      }
    }

    const updated = await this.memberRepo.updateRole(memberId, dto.role);
    return {
      id: updated.id,
      storeId: updated.storeId,
      userId: updated.userId,
      role: updated.role,
      invitedBy: updated.invitedBy,
      joinedAt: updated.joinedAt,
      user: updated.user,
    };
  }
}
