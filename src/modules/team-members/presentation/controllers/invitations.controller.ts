import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
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
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IUserRepository } from '@/modules/users/domain/repositories/user.repository.interface';
import { ListMyInvitationsUseCase } from '../../application/use-cases/list-my-invitations.use-case';
import { AcceptInvitationUseCase } from '../../application/use-cases/accept-invitation.use-case';
import { DeclineInvitationUseCase } from '../../application/use-cases/decline-invitation.use-case';
import {
  AcceptInvitationResponseDto,
  StoreInvitationResponseDto,
} from '../../application/dto/team-member.dto';

@ApiTags('Invitations')
@ApiBearerAuth()
@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(
    private readonly listMine: ListMyInvitationsUseCase,
    private readonly accept: AcceptInvitationUseCase,
    private readonly decline: DeclineInvitationUseCase,
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Lista invitaciones pendientes para el user logueado' })
  @ApiResponse({ status: 200, type: [StoreInvitationResponseDto] })
  async myInvitations(@Req() req: any): Promise<StoreInvitationResponseDto[]> {
    const user = await this.userRepo.findById(req.user.userId);
    if (!user) return [];
    return this.listMine.execute(user.email);
  }

  @Post(':token/accept')
  @ApiOperation({ summary: 'Acepta una invitacion (requiere email match)' })
  @ApiParam({ name: 'token', type: 'string' })
  @ApiResponse({ status: 201, type: AcceptInvitationResponseDto })
  async acceptInvitation(
    @Param('token') token: string,
    @Req() req: any,
  ): Promise<AcceptInvitationResponseDto> {
    return this.accept.execute(token, req.user.userId);
  }

  @Post(':token/decline')
  @ApiOperation({ summary: 'Declina una invitacion' })
  @ApiParam({ name: 'token', type: 'string' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async declineInvitation(@Param('token') token: string, @Req() req: any): Promise<void> {
    return this.decline.execute(token, req.user.userId);
  }
}
