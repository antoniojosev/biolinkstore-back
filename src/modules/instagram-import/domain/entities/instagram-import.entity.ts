export type InstagramImportStatus = 'RUNNING' | 'PROCESSING' | 'DONE' | 'FAILED';

export class InstagramImport {
  id: string;
  storeId: string;
  handle: string;
  status: InstagramImportStatus;
  apifyRunId: string | null;
  apifyDatasetId: string | null;
  postsFound: number;
  postsProcessed: number;
  postsSkipped: number;
  productsCreated: number;
  profileName: string | null;
  profileFollowers: number | null;
  error: string | null;
  requestedAt: Date;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<InstagramImport>) {
    Object.assign(this, partial);
  }
}
