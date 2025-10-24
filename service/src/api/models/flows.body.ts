export enum FormatUrn {
    VIDEO = 'urn:x-nmos:format:video',
    IMAGE = 'urn:x-nmos:format:image',
    AUDIO = 'urn:x-nmos:format:audio',
    DATA = 'urn:x-nmos:format:data',
    MULTI = 'urn:x-nmos:format:multi'
}

export enum InterlaceMode {
    PROGRESSIVE = 'progressive',
    INTERLACE_TFF = 'interlaced_tff',
    INTERLACE_BFF = 'interlaced_bff',
    INTERLACE_PSF = 'interlaced_psf',
}

export enum ColorSpace {
    BT601 = 'BT601',
    BT709 = 'BT709',
    BT2020 = 'BT2020',
    BT2100 = 'BT2100',
}

export enum TransferCharacteristics {
    SDR = 'SDR',
    HLG = 'HLG',
    PQ = 'PQ',
}

export enum ComponentType {
    YCbCr = 'YCbCr',
    RGB = 'RGB',
}

export enum VideoUNCType {
    PLANAR = 'planar',
    YUYV = 'YUYV',
    UYVY = 'UYVY',
    AYUV = 'AYUV',
    V210 = 'v210',
    V216 = 'v216',
    RGB = 'RGB',
    RGBX = 'RGBx',
    XRGB = 'xRGB',
    BGRX = 'BGRx',
    XBGR = 'xBGR',
    RGBA = 'RGBA',
    ARGB = 'ARGB',
    BGRA = 'BGRA',
    ABGR = 'ABGR',
    ALPHA = 'alpha',
}

export enum AudioUNCType {
    INTERLEAVED = 'interleaved',
    PLANAR = 'planar',
    PAIRS = 'pairs',
}

export interface Fraction {
    numerator: number;
    denominator?: number;
}

export interface AspectRatio {
    numerator: number;
    denominator: number;
}

export interface ContainerMapping {
    track_index?: number;
    format_track_index?: number;
    audio_track?: {
        channel_numbers?: number[];
        channel_range?: string;
    };
    mp2ts_container?: {
        pid?: number;
    }
    mxf_container?: {
        package_uid?: string;
        track_id?: number;
    }
    isobmff_container?: {
        track_id?: number;
    }
}

export interface FlowCollectionItem {
    id: string;
    role: string;
    container_mapping?: ContainerMapping
}

export interface CommonFlow {
    id: string;
    source_id: string;
    label?: string;
    description?: string;
    created_by?: string;
    updated_by?: string;
    tags?: Record<string, string>;
    metadata_version?: string;
    generation?: number;
    created?: string | Date;
    metadata_updated?: string | Date;
    segments_updated?: string | Date;
    read_only?: boolean;
    codec: string;
    container?: string;
    avg_bit_rate?: number;
    max_bit_rate?: number;
    segment_duration?: Fraction;
    timerange?: string;
    flow_collection?: FlowCollectionItem[];
    collected_by?: string[];
    container_mapping?: ContainerMapping;
}

export interface VideoFlow extends CommonFlow {
    format: FormatUrn.VIDEO
    essence_parameters: {
        frame_rate?: Fraction;
        frame_width: number;
        frame_height: number;
        bit_depth?: number;
        interlace_mode?: InterlaceMode;
        colorspace?: ColorSpace;
        transfer_characteristics?: TransferCharacteristics;
        aspect_ratio?: AspectRatio;
        pixel_aspect_ratio?: AspectRatio;
        component_type?: ComponentType;
        horiz_chroma_subs?: number;
        vert_chroma_subs?: number;
        unc_parameters?: {
            unc_type: string;
        }
        avc_parameters?: {
            profile: number;
            level: number;
            flags: number;
        }
    }
}

export interface AudioFlow extends CommonFlow {
    format: FormatUrn.AUDIO;
    essence_parameters: {
        sample_rate: number;
        channels: number;
        bit_depth?: number;
        codec_parameters?: {
            coded_frame_size?: number;
            mp4_oti?: number;
        }
        unc_parameters?: {
            unc_type: AudioUNCType;
        }
    }
}

export interface ImageFlow extends CommonFlow {
    format: FormatUrn.IMAGE;
    essence_parameters: {
        frame_width: number;
        frame_height: number;
        aspect_ratio?: AspectRatio;
    }
}

export interface DataFlow extends CommonFlow {
    format: FormatUrn.DATA;
    essence_parameters: {
        data_type?: string;
    }
}

export interface MultiFlow extends CommonFlow {
    format: FormatUrn.MULTI;
}

export type Flow = VideoFlow | AudioFlow | ImageFlow | DataFlow | MultiFlow;

export type FlowTags = Record<string, string>;

export interface PostFlowMediaStorageRequest {
    storage_id?: string;
    limit?: number;
    object_ids?: string[];
}

export interface MediaBucketObjectStoreItem {
    object_id: string;
    put_url: {
        url: string;
        body?: string;
        'content-type'?: string;
        headers?: Record<string, string>;
    };
}

export interface MediaBucketObjectStore {
    media_objects: MediaBucketObjectStoreItem[];
}
