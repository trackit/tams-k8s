import { SourceUrn } from "./source.body";

export interface GetSourcesQueryParamsRequest {
  label?: string;
  [key: `tags.${string}`]: string;
  [key: `tags_exists.${string}`]: string;
  format?: SourceUrn;
  page?: string;
  limit?: number;
}

export interface GetSourceQueryParamsRequest {}
