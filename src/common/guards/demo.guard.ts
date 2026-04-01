import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

/**
 * DemoGuard — blocks write operations for demo users.
 *
 * Users with isDemo=true cannot POST/PATCH/DELETE unless their email
 * is listed in DEMO_EXEMPT_EMAILS (comma-separated env var).
 *
 * Read operations (GET) are always allowed.
 */
@Injectable()
export class DemoGuard implements CanActivate {
  private readonly exemptEmails: Set<string>;

  constructor(private readonly prisma: PrismaService) {
    const raw = process.env.DEMO_EXEMPT_EMAILS ?? '';
    this.exemptEmails = new Set(
      raw
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;

    // Allow all read operations
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }

    const userId: string | undefined = request.user?.userId;
    const email: string | undefined = request.user?.email;

    if (!userId) return true; // JwtAuthGuard will handle auth

    // Exempt emails bypass the restriction
    if (email && this.exemptEmails.has(email.toLowerCase())) {
      return true;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isDemo: true },
    });

    if (user?.isDemo) {
      throw new ForbiddenException(
        'Las cuentas demo no pueden realizar modificaciones.',
      );
    }

    return true;
  }
}
