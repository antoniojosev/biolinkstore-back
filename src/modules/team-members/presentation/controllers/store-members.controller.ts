import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ListStoreMembersUseCase } from '../../application/use-cases/list-store-members.use-case';
import { ListPendingInvitationsUseCase } from '../../application/use-cases/list-pending-invitations.use-case';
import { InviteMemberUseCase } from '../../application/use-cases/invite-member.use-case';
import { UpdateMemberRoleUseCase } from '../../application/use-cases/update-member-role.use-case';
import { RemoveMemberUseCase } from '../../application/use-cases/remove-member.use-case';
import {
  InviteMemberDto,
  StoreInvitationResponseDto,
  StoreMemberResponseDto,
  UpdateMemberRoleDto,
} from '../../application/dto/team-member.dto';
import { StoreMemberPermissionService } from '../../domain/services/store-member-permission.service';
import { MinRole, StoreMemberGuard } from '../guards/store-member.guard';

@ApiTags('Team Members')
@ApiBearerAuth()
@Controller('stores/:storeId/members')
@UseGuards(JwtAuthGuard, StoreMemberGuard)
export class StoreMembersController {
  constructor(
    private readonly listMembers: ListStoreMembersUseCase,
    private readonly listPendingInvitations: ListPendingInvitationsUseCase,
    private readonly inviteMember: InviteMemberUseCase,
    private readonly updateRole: UpdateMemberRoleUseCase,
    private readonly removeMember: RemoveMemberUseCase,
    private readonly permissions: StoreMemberPermissionService,
  ) {}

  @Get()
  @MinRole('STAFF')
  @ApiOperation({ summary: 'Lista miembros del store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: [StoreMemberResponseDto] })
  async list(@Param('storeId') storeId: string): Promise<StoreMemberResponseDto[]> {
    return this.listMembers.execute(storeId);
  }

  @Get('invitations')
  @MinRole('OWNER')
  @ApiOperation({ summary: 'Lista invitaciones pendientes del store (solo OWNER)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: [StoreInvitationResponseDto] })
  async listInvitations(
    @Param('storeId') storeId: string,
  ): Promise<StoreInvitationResponseDto[]> {
    return this.listPendingInvitations.execute(storeId);
  }

  @Post('invite')
  @MinRole('OWNER')
  @ApiOperation({ summary: 'Invita un miembro por email (solo OWNER)' })
  @ApiResponse({ status: 201, type: StoreInvitationResponseDto })
  async invite(
    @Param('storeId') storeId: string,
    @Body() dto: InviteMemberDto,
    @Req() req: any,
  ): Promise<StoreInvitationResponseDto> {
    return this.inviteMember.execute(storeId, dto, req.user.userId);
  }

  @Patch(':memberId/role')
  @MinRole('OWNER')
  @ApiOperation({ summary: 'Cambia el rol de un miembro (solo OWNER)' })
  async patchRole(
    @Param('storeId') storeId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<StoreMemberResponseDto> {
    return this.updateRole.execute(storeId, memberId, dto);
  }

  @Delete(':memberId')
  @MinRole('STAFF')
  @ApiOperation({
    summary: 'Remueve un miembro. OWNER/ADMIN puede remover cualquiera; STAFF solo a si mismo.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('storeId') storeId: string,
    @Param('memberId') memberId: string,
    @Req() req: any,
  ): Promise<void> {
    const role = req.storeMemberRole;
    const isOwnerOrAdmin = this.permissions.isOwnerOrAdmin(role);
    return this.removeMember.execute(storeId, memberId, req.user.userId, isOwnerOrAdmin);
  }
}
