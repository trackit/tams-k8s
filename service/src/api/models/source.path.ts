export interface GetSourcePathParams {
  sourceId: string;
}

// Tags
export interface GetSourceTagsPathParams {
  sourceId: string;
}

export interface GetSourceTagPathParams {
  sourceId: string;
  name: string;
}

export interface PutSourceTagPathParams {
  sourceId: string;
  name: string;
}

export interface DeleteSourceTagPathParams {
  sourceId: string;
  name: string;
}

// Description
export interface HeadSourceDescriptionPathParams {
  sourceId: string;
}

export interface GetSourceDescriptionPathParams {
  sourceId: string;
}

export interface PutSourceDescriptionPathParams {
  sourceId: string;
}

export interface DeleteSourceDescriptionPathParams {
  sourceId: string;
}

// Label
export interface GetSourceLabelPathParams {
  sourceId: string;
}

export interface PutSourceLabelPathParams {
  sourceId: string;
}

export interface DeleteSourceLabelPathParams {
  sourceId: string;
}
