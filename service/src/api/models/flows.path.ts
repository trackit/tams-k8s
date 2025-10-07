export interface PutFlowPathParams {
    flowId: string;
}

export interface GetFlowPathParams {
    flowId: string;
}

// Tags
export interface GetFlowTagsPathParams {
    flowId: string;
}

export interface GetFlowTagPathParams {
    flowId: string;
    name: string;
}

export interface PutFlowTagPathParams {
    flowId: string;
    name: string;
}

export interface DeleteFlowTagPathParams {
    flowId: string;
    name: string;
}

// Description
export interface GetFlowDescriptionPathParams {
    flowId: string;
}

export interface PutFlowDescriptionPathParams {
    flowId: string;
}

export interface DeleteFlowDescriptionPathParams {
    flowId: string;
}

// Label
export interface GetFlowLabelPathParams {
    flowId: string;
}

export interface PutFlowLabelPathParams {
    flowId: string;
}

export interface DeleteFlowLabelPathParams {
    flowId: string;
}

// Read Only
export interface GetFlowReadOnlyPathParams {
    flowId: string;
}

export interface PutFlowReadOnlyPathParams {
    flowId: string;
}
