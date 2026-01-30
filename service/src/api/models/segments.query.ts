export interface ListSegmentsQueryParams {
  object_id?: string;
  timerange?: string;
  limit?: number;
  page?: string;
  reverse_order?: boolean;
  include_object_timerange?: boolean;
  verbose_storage?: boolean;
  accept_get_urls?: string;
  accept_storage_ids?: string;
  presigned?: boolean;
}

export interface DeleteSegmentsQueryParams {
  timerange?: string;
  object_id?: string;
}
