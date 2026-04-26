import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreMemberRepository } from '../../domain/repositories/store-member.repository.interface';
import { StoreMemberResponseDto } from '../dto/team-member.dto';

@Injectable()
export class ListStoreMembersUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_MEMBER_REPOSITORY)
    private readonly memberRepo: IStoreMemberRepository,
  ) {}

  async execute(storeId: string): Promise<StoreMemberResponseDto[]> {
    const members = await this.memberRepo.findByStoreId(storeId);
    return members.map((m) => ({
      id: m.id,
      storeId: m.storeId,
      userId: m.userId,
      role: m.role,
      invitedBy: m.invitedBy,
      joinedAt: m.joinedAt,
      user: m.user,
    }));
  }
}
