import { Injectable } from '@nestjs/common';

/**
 * Lock en memoria (un solo proceso de backend, sin escalado horizontal hoy)
 * para que la resolucion lazy del endpoint de estado no dispare un segundo
 * poll/proceso mientras el fire-and-forget original sigue vivo. Si en el
 * futuro corren varias instancias del backend, esto necesita moverse a un
 * lock a nivel DB (ej. columna `processingLockedAt` con expiracion).
 */
@Injectable()
export class ImportProcessingLockService {
  private readonly active = new Set<string>();

  tryAcquire(importId: string): boolean {
    if (this.active.has(importId)) return false;
    this.active.add(importId);
    return true;
  }

  release(importId: string): void {
    this.active.delete(importId);
  }
}
