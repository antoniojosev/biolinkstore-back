import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreMemberRepository } from '../../domain/repositories/store-member.repository.interface';
import { IStoreInvitationRepository } from '../../domain/repositories/store-invitation.repository.interface';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { EmailService } from '@/modules/email/email.service';
import { InviteMemberDto, StoreInvitationResponseDto } from '../dto/team-member.dto';
import { validateTeamLimit } from '../helpers/team-limits.helper';

const INVITATION_EXPIRY_DAYS = 7;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bylink.app';

@Injectable()
export class InviteMemberUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_MEMBER_REPOSITORY)
    private readonly memberRepo: IStoreMemberRepository,
    @Inject(INJECTION_TOKENS.STORE_INVITATION_REPOSITORY)
    private readonly invitationRepo: IStoreInvitationRepository,
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepo: IStoreRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(
    storeId: string,
    dto: InviteMemberDto,
    invitedBy: string,
  ): Promise<StoreInvitationResponseDto> {
    const store = await this.storeRepo.findByIdWithSubscription(storeId);
    if (!store) throw new NotFoundException('Store not found');

    const normalizedEmail = dto.email.toLowerCase().trim();

    const plan = store.subscription?.plan ?? 'FREE';
    const [acceptedCount, pendingInvitations] = await Promise.all([
      this.memberRepo.countByStoreId(storeId),
      this.invitationRepo.findPendingByStoreId(storeId),
    ]);
    // El limite del plan cuenta miembros aceptados + invitaciones pendientes:
    // si no se contaran las pendientes, se podrian mandar N invitaciones sin
    // limite mientras ninguna se acepte todavia.
    validateTeamLimit(plan, acceptedCount + pendingInvitations.length);

    const existingPending = pendingInvitations.find((inv) => inv.email === normalizedEmail);
    if (existingPending) {
      throw new ConflictException('Ya existe una invitacion pendiente para este email');
    }

    if (dto.role === 'OWNER') {
      throw new BadRequestException(
        'No se puede invitar como OWNER directamente. Promueve a OWNER despues de aceptar.',
      );
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await this.invitationRepo.create({
      storeId,
      email: normalizedEmail,
      role: dto.role,
      token,
      invitedBy,
      expiresAt,
    });

    const acceptUrl = `${FRONTEND_URL}/invite/${token}`;
    await this.emailService.sendEmail(
      normalizedEmail,
      `Te invitaron a colaborar en ${store.name}`,
      this.buildEmailHtml(store.name, dto.role, acceptUrl, expiresAt),
    );

    return this.toResponse(invitation);
  }

  private toResponse(invitation: any): StoreInvitationResponseDto {
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

  private buildEmailHtml(storeName: string, role: string, acceptUrl: string, expiresAt: Date): string {
    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0F0F0F">
        <h1 style="font-size:22px;margin:0 0 16px">Te invitaron a colaborar en <strong>${storeName}</strong></h1>
        <p style="line-height:1.5">Tienes un nuevo rol <strong>${role}</strong> esperandote en ByLink.</p>
        <p style="line-height:1.5">Aceptala antes del ${expiresAt.toLocaleDateString('es-VE')}:</p>
        <p style="margin:24px 0">
          <a href="${acceptUrl}" style="background:#0F6BA8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Aceptar invitacion</a>
        </p>
        <p style="font-size:13px;color:#666;line-height:1.5">Si no esperabas esta invitacion, ignorala. Necesitas una cuenta ByLink con este email para aceptar.</p>
        <p style="font-size:13px;color:#666;margin-top:32px">— Equipo ByLink</p>
      </div>
    `;
  }
}
