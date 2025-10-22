import { FormatUrn } from "@tams-k8s/api";

export interface GetSourcesQueryParamsRequest {
  label?: string;
  [key: `tags.${string}`]: string;
  [key: `tags_exists.${string}`]: string;
  format?: FormatUrn;
  page?: string;
  limit?: number;
}

export interface GetSourceQueryParamsRequest {}
