export enum SourceUrn {
  VIDEO = "urn:x-nmos:format:video",
  IMAGE = "urn:x-nmos:format:image",
  AUDIO = "urn:x-nmos:format:audio",
  DATA = "urn:x-nmos:format:data",
  MULTI = "urn:x-nmos:format:multi",
}

export interface SourceCollectionItem {
  id: string;
  role: string;
}

export type SourceTags = Record<string, string>;

export interface Source {
  id: string;
  format: SourceUrn;
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

