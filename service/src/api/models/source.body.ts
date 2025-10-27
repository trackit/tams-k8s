import { FormatUrn } from "./common.body";

export interface SourceCollectionItem {
  id: string;
  role: string;
}

export type SourceTags = Record<string, string | string[]>;

export interface Source {
  id: string;
  format: FormatUrn;
  label?: string;
  description?: string;
  created_by?: string;
  updated_by?: string;
  created?: string | Date;
  updated?: string | Date;
  tags?: SourceTags;
  source_collection?: SourceCollectionItem[];
  collected_by?: string[];
}
