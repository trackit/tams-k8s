import { FormatUrn } from "@tams-k8s/api";
import { createInjectionToken } from "../di";

export interface ListSourcesFilters {
  format?: string;
  label?: string;
  tags?: Record<string, string | string[]>;
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
  format: FormatUrn;

  label?: string;
  description?: string;
  tags?: Record<string, string | string[]>;

  created?: string | Date;
  updated?: string | Date;
  createdBy?: string;
  updatedBy?: string;

  collectedBy?: string[];
  sourceCollection?: SourceCollectionItem[];
}

export interface ListSourcesResponse {
  sources: Source[];
  limit?: number;
  nextPageToken?: string;
}

export interface SourceRepository {
  listSources(filters?: ListSourcesFilters): Promise<ListSourcesResponse>;
  getSourceById(sourceId: string): Promise<Source | null>;
  putSource(source: Source): Promise<Source>;
  deleteSource(sourceId: string): Promise<boolean>;
}

export const sourceRepositoryToken =
  createInjectionToken<SourceRepository>("SourceRepository");
