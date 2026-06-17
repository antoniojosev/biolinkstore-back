import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

/**
 * BE-127 — Resuelve el `storeId` activo del request.
 *
 * Orden de resolucion:
 *  1. `req.params.storeId` si el path lo trae (compatibilidad con endpoints existentes).
 *  2. `req.user.activeStoreId` (poblado por el JWT payload — opcional).
 *  3. Lectura directa de `users.activeStoreId` desde DB queda fuera de este decorator
 *     para no acoplarlo a Prisma; se resuelve en el use-case si emerge necesidad.
 *
 * Si ninguna fuente provee storeId, lanza 400 con mensaje accionable.
 *
 * Decision: Opcion A (param decorator puro) frente a Opcion B (middleware global).
 * Razon: A es la menos invasiva — no modifica `req`, no altera el contrato de
 * endpoints existentes con `:storeId`, y solo se aplica donde el desarrollador
 * lo opta-in con `@ActiveStoreId()`.
 *
 * Uso:
 *   ```ts
 *   @Get('foo')
 *   bar(@ActiveStoreId() storeId: string) { ... }
 *   ```
 */
export const ActiveStoreId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    const explicit = request.params?.storeId as string | undefined;
    if (explicit) return explicit;

    const fromUser = (request.user as { activeStoreId?: string } | undefined)
      ?.activeStoreId;
    if (fromUser) return fromUser;

    throw new BadRequestException(
      'No active store. Selecciona o crea una tienda antes de continuar.',
    );
  },
);
