export type WordIdentifier = string;

export interface WordVersionMetadata {
  latestVersionId?: string | number | null;
  activeVersionId?: string | number | null;
  [key: string]: unknown;
}

export interface WordVersionLike {
  id?: string | number | null;
  versionId?: string | number | null;
  metadata?: {
    id?: string | number | null;
    versionId?: string | number | null;
  } | null;
  createdAt?: string | Date | null;
  [key: string]: unknown;
}

export interface WordVersion extends WordVersionLike {
  id: WordIdentifier;
}

export interface WordCacheRecord {
  versions: WordVersion[];
  activeVersionId: WordIdentifier | null;
  metadata: WordVersionMetadata;
}

export interface VersionSelectionContext {
  versions: WordVersion[];
  preferredId?: string | number | null;
  current?: WordCacheRecord;
  metadata?: WordVersionMetadata | null;
}

export interface VersionSelectionStrategy {
  pick(context: VersionSelectionContext): WordIdentifier | null;
}
