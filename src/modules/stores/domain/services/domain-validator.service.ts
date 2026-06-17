import { randomBytes } from 'node:crypto';

// Reserved hosts we never accept as a custom domain.
const RESERVED_DOMAINS = new Set([
  'bylink.app',
  'www.bylink.app',
  'localhost',
]);

const LABEL_REGEX = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

export class DomainValidatorService {
  /**
   * Normalizes (lowercase, strip protocol/path/port) and validates a custom domain.
   * Throws Error with a user-readable message when invalid.
   */
  static normalizeAndValidate(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('domain must be a string');
    }

    let host = input.trim().toLowerCase();
    if (host.length === 0) {
      throw new Error('domain is required');
    }

    // Strip protocol if present
    host = host.replace(/^https?:\/\//, '');

    // Strip path/query/fragment
    host = host.split('/')[0];
    host = host.split('?')[0];
    host = host.split('#')[0];

    // Strip port
    host = host.split(':')[0];

    // Strip leading wildcard `*.`
    host = host.replace(/^\*\./, '');

    // Strip trailing dot
    if (host.endsWith('.')) host = host.slice(0, -1);

    if (RESERVED_DOMAINS.has(host)) {
      throw new Error(`domain ${host} is reserved`);
    }

    if (host.length > 253) {
      throw new Error('domain too long (max 253 chars)');
    }

    const labels = host.split('.');
    if (labels.length < 2) {
      throw new Error('domain must have at least one dot (e.g. example.com)');
    }

    for (const label of labels) {
      if (!LABEL_REGEX.test(label)) {
        throw new Error(`invalid label "${label}" in domain`);
      }
    }

    return host;
  }

  /**
   * Generates a 32-char hex random verification token (16 bytes → 32 hex chars).
   */
  static generateVerificationToken(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Returns the host the merchant must publish the TXT record under.
   */
  static verificationHost(domain: string): string {
    return `_bylink-verify.${domain}`;
  }
}
