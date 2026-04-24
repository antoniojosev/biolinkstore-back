/**
 * Abstraction over DNS TXT lookup so we can stub it in tests.
 * Resolves to the array-of-strings shape that node:dns returns
 * (each TXT record is an array of chunks; we already join them on read).
 */
export interface IDnsTxtResolver {
  /**
   * Returns each TXT record found, joined to a single string per record.
   * If the host has no TXT records, returns []. Throws on resolver errors
   * other than NXDOMAIN/NODATA (those map to []).
   */
  resolveTxt(host: string): Promise<string[]>;
}
