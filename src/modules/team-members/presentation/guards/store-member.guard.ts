import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StoreMemberRole } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreMemberRepository } from '../../domain/repositories/store-member.repository.interface';
import { StoreMemberPermissionService } from '../../domain/services/store-member-permission.service';

const MIN_ROLE_KEY = 'min-store-role';

/**
 * Marca un endpoint para requerir minimo rol del miembro.
 * Default sin decorator: STAFF (cualquier miembro autenticado).
 *
 * Uso:
 *   @MinRole('OWNER')
 *   @UseGuards(JwtAuthGuard, StoreMemberGuard)
 */
export const MinRole = (role: StoreMemberRole) => SetMetadata(MIN_ROLE_KEY, role);

@Injectable()
export class StoreMemberGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(INJECTION_TOKENS.STORE_MEMBER_REPOSITORY)
    private readonly memberRepo: IStoreMemberRepository,
    private readonly permissions: StoreMemberPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const storeId = request.params.storeId || request.body?.storeId;

    if (!userId || !storeId) {
      throw new ForbiddenException('Missing user or store information');
    }

    const member = await this.memberRepo.findByStoreAndUser(storeId, userId);
    if (!member) {
      throw new ForbiddenException('No eres miembro de esta tienda');
    }

    const minRole =
      this.reflector.get<StoreMemberRole>(MIN_ROLE_KEY, context.getHandler()) ?? 'STAFF';

    if (!this.permissions.hasMinRole(member.role, minRole)) {
      throw new ForbiddenException(`Requiere rol minimo ${minRole}, tienes ${member.role}`);
    }

    request.storeId = storeId;
    request.storeMemberRole = member.role;
    return true;
  }
}
