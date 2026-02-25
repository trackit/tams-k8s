import {
  AspectRatio,
  AudioUNCType,
  ColorSpace,
  ComponentType,
  FormatUrn,
  InterlaceMode,
  TransferCharacteristics,
} from "@tams-k8s/api";
import { createInjectionToken } from "../di";

export interface ListFlowsFilters {
  sourceId?: string;
  timerange?: string;
  flowFormat?: string;
  codec?: string;
  label?: string;
  frameWidth?: number;
  frameHeight?: number;
  tags?: Record<string, string>;
  limit?: number;
  pageToken?: string;
  haveTags?: string[];
  doesNotHaveTags?: string[];
}

export interface ListFlowsResponse {
  flows: Flow[];
  limit?: number;
  nextPageToken?: string;
}

export interface Fraction {
  numerator: number;
  denominator?: number;
}

export interface FlowCollectionItem {
  id: string;
  role: string;
  containerMapping?: ContainerMapping;
}

export interface ContainerMapping {
  trackIndex?: number;
  formatTrackIndex?: number;
  audioTrack?: {
    channelNumbers?: number[];
    channelRange?: string;
  };
  mp2tsContainer?: {
    pid?: number;
  };
  mxfContainer?: {
    packageUid?: string;
    trackId?: number;
  };
  isobmffContainer?: {
    trackId?: number;
  };
}

export interface CommonFlow {
  flowId: string;
  sourceId: string;
  label?: string;
  description?: string;
  createdBy?: string;
  updatedBy?: string;
  tags?: Record<string, string>;
  metadataVersion?: string;
  generation?: number;
  created?: string | Date;
  metadataUpdated?: string | Date;
  segmentsUpdated?: string | Date;
  readOnly?: boolean;
  codec: string;
  container?: string;
  avgBitRate?: number;
  maxBitRate?: number;
  segmentDuration?: Fraction;
  timerange?: string;
  flowCollection?: FlowCollectionItem[];
  collectedBy?: string[];
  containerMapping?: ContainerMapping;
}

export interface VideoFlow extends CommonFlow {
  format: FormatUrn.VIDEO;
  essenceParameters: {
    frameRate?: Fraction;
    frameWidth: number;
    frameHeight: number;
    bitDepth?: number;
    interlaceMode?: InterlaceMode;
    colorspace?: ColorSpace;
    transferCharacteristics?: TransferCharacteristics;
    aspectRatio?: AspectRatio;
    pixelAspectRatio?: AspectRatio;
    componentType?: ComponentType;
    horizChromaSubs?: number;
    vertChromaSubs?: number;
    uncParameters?: {
      uncType: string;
    };
    avcParameters?: {
      profile: number;
      level: number;
      flags: number;
    };
  };
}

export interface AudioFlow extends CommonFlow {
  format: FormatUrn.AUDIO;
  essenceParameters: {
    sampleRate: number;
    channels: number;
    bitDepth?: number;
    codecParameters?: {
      codedFrameSize?: number;
      mp4Oti?: number;
    };
    uncParameters?: {
      uncType: AudioUNCType;
    };
  };
}

export interface ImageFlow extends CommonFlow {
  format: FormatUrn.IMAGE;
  essenceParameters: {
    frameWidth: number;
    frameHeight: number;
    aspectRatio?: AspectRatio;
  };
}

export interface DataFlow extends CommonFlow {
  format: FormatUrn.DATA;
  essenceParameters: {
    dataType?: string;
  };
}

export interface MultiFlow extends CommonFlow {
  format: FormatUrn.MULTI;
}

export type Flow = VideoFlow | AudioFlow | ImageFlow | DataFlow | MultiFlow;

export interface FlowRepository {
  listFlows(filters?: ListFlowsFilters): Promise<ListFlowsResponse>;
  getFlowById(flowId: string): Promise<Flow | null>;
  putFlow(flow: Flow): Promise<Flow>;
}

export const flowRepositoryToken =
  createInjectionToken<FlowRepository>("FlowRepository");
