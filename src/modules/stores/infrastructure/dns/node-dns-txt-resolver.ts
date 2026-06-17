import { Injectable, Logger } from '@nestjs/common';
import { promises as dns } from 'node:dns';
import { IDnsTxtResolver } from '../../domain/services/dns-txt-resolver.interface';

const NO_DATA_CODES = new Set(['ENOTFOUND', 'ENODATA', 'NXDOMAIN', 'EAI_AGAIN']);

@Injectable()
export class NodeDnsTxtResolver implements IDnsTxtResolver {
  private readonly logger = new Logger(NodeDnsTxtResolver.name);

  async resolveTxt(host: string): Promise<string[]> {
    try {
      const records = await dns.resolveTxt(host);
      // node returns string[][] — each record may be split across chunks; join them.
      return records.map((chunks) => chunks.join(''));
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code && NO_DATA_CODES.has(code)) {
        return [];
      }
      this.logger.warn(`DNS TXT lookup failed for ${host}: ${(err as Error).message}`);
      throw err;
    }
  }
}
