import { SourceUrn } from "@tams-k8s/api";

export interface ListSourcesFilters {
  format?: string;
  label?: string;
  tags?: Record<string, string>;
  haveTags?: string[];
  doesNotHaveTags?: string[];
  page?: string;
  limit?: number;
}

export interface SourceCollectionItem {
  id: string;
  role: string;
}

export interface Source {
  id: string;
  format: SourceUrn;

  label?: string;
  description?: string;
  tags?: Record<string, string>;

  created?: string | Date;
  updated?: string | Date;
  createdBy?: string;
  updatedBy?: string;

  collectedBy?: string[];
  sourceCollection?: SourceCollectionItem[];
}

export interface SourceRepository {
  listSources(filters?: ListSourcesFilters): Promise<Source[]>;
  getSourceById(sourceId: string): Promise<Source | null>;
  putSource(source: Source): Promise<Source>;
}
