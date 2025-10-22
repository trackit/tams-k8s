import { FormatUrn } from "@tams-k8s/api";

export interface GetSourcesQueryParamsRequest {
  label?: string;
  [key: `tags.${string}`]: string;
  [key: `tags_exists.${string}`]: boolean;
  format?: FormatUrn;
  page?: string;
  limit?: number;
}
