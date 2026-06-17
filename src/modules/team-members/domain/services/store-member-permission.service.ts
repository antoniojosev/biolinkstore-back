import { Injectable } from '@nestjs/common';
import { StoreMemberRole } from '@prisma/client';

const ROLE_RANK: Record<StoreMemberRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  STAFF: 1,
};

@Injectable()
export class StoreMemberPermissionService {
  hasMinRole(actualRole: StoreMemberRole, minRole: StoreMemberRole): boolean {
    return ROLE_RANK[actualRole] >= ROLE_RANK[minRole];
  }

  isOwnerOrAdmin(role: StoreMemberRole): boolean {
    return role === 'OWNER' || role === 'ADMIN';
  }
}
