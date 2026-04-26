import { Module } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { StoresModule } from '../stores/stores.module';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';

// Domain
import { StoreMemberPermissionService } from './domain/services/store-member-permission.service';

// Application
import { ListStoreMembersUseCase } from './application/use-cases/list-store-members.use-case';
import { InviteMemberUseCase } from './application/use-cases/invite-member.use-case';
import { UpdateMemberRoleUseCase } from './application/use-cases/update-member-role.use-case';
import { RemoveMemberUseCase } from './application/use-cases/remove-member.use-case';
import { ListMyInvitationsUseCase } from './application/use-cases/list-my-invitations.use-case';
import { AcceptInvitationUseCase } from './application/use-cases/accept-invitation.use-case';
import { DeclineInvitationUseCase } from './application/use-cases/decline-invitation.use-case';

// Infrastructure
import { PrismaStoreMemberRepository } from './infrastructure/persistence/prisma-store-member.repository';
import { PrismaStoreInvitationRepository } from './infrastructure/persistence/prisma-store-invitation.repository';

// Presentation
import { StoreMembersController } from './presentation/controllers/store-members.controller';
import { InvitationsController } from './presentation/controllers/invitations.controller';
import { StoreMemberGuard } from './presentation/guards/store-member.guard';

@Module({
  imports: [DatabaseModule, StoresModule, UsersModule, EmailModule],
  controllers: [StoreMembersController, InvitationsController],
  providers: [
    // Domain
    StoreMemberPermissionService,

    // Use Cases
    ListStoreMembersUseCase,
    InviteMemberUseCase,
    UpdateMemberRoleUseCase,
    RemoveMemberUseCase,
    ListMyInvitationsUseCase,
    AcceptInvitationUseCase,
    DeclineInvitationUseCase,

    // Guard
    StoreMemberGuard,

    // Repository bindings
    {
      provide: INJECTION_TOKENS.STORE_MEMBER_REPOSITORY,
      useClass: PrismaStoreMemberRepository,
    },
    {
      provide: INJECTION_TOKENS.STORE_INVITATION_REPOSITORY,
      useClass: PrismaStoreInvitationRepository,
    },
  ],
  exports: [
    INJECTION_TOKENS.STORE_MEMBER_REPOSITORY,
    INJECTION_TOKENS.STORE_INVITATION_REPOSITORY,
    StoreMemberPermissionService,
    StoreMemberGuard,
  ],
})
export class TeamMembersModule {}
