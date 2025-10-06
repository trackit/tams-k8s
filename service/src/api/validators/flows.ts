import Joi from "joi";
import {
    Flow,
    Fraction,
    FlowCollectionItem,
    ContainerMapping, FormatUrn, VideoFlow, InterlaceMode, ColorSpace, TransferCharacteristics, AspectRatio,
    ComponentType, VideoUNCType, DataFlow, ImageFlow, AudioFlow, AudioUNCType
} from "@tams-k8s/api";
import { codecValidator } from './codec';
import { timerangeValidator } from './timerange';

export const fractionValidator = Joi.object<Fraction>({
    numerator: Joi.number().min(1).required(),
    denominator: Joi.number().min(1),
});

export const aspectRatioValidator = Joi.object<AspectRatio>({
    numerator: Joi.number().min(1).required(),
    denominator: Joi.number().min(1).required(),
});

export const containerMappingValidator = Joi.object<ContainerMapping>({
    track_index: Joi.number().min(0),
    format_track_index: Joi.number().min(0),
    audio_track: Joi.object<ContainerMapping['audio_track']>({
        channel_numbers: Joi.array().items(Joi.number().min(0)).min(1),
        channel_range: Joi.string().regex(/^[0-9]+_[0-9]+$/),
    }),
    mp2ts_container: Joi.object<ContainerMapping['mp2ts_container']>({
        pid: Joi.number(),
    }),
    mxf_container: Joi.object<ContainerMapping['mxf_container']>({
        package_uid: Joi.string().regex(/^urn:smpte:umid:[0-9a-fA-F]{8}(.[0-9a-fA-F]{8}){7}$|^urn:uuid:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
        track_id: Joi.number(),
    }),
    isobmff_container: Joi.object<ContainerMapping['isobmff_container']>({
        track_id: Joi.number(),
    })
})

export const flowCollectionItemValidator = Joi.object<FlowCollectionItem>({
    id: Joi.string().uuid().required(),
    role: Joi.string().required(),
    container_mapping: containerMappingValidator,
});

export const videoEssenceParametersValidator = Joi.object<VideoFlow['essence_parameters']>({
    frame_rate: fractionValidator,
    frame_width: Joi.number().min(1).required(),
    frame_height: Joi.number().min(1).required(),
    bit_depth: Joi.number().min(1),
    interlace_mode: Joi.string().valid(...Object.values(InterlaceMode)),
    colorspace: Joi.string().valid(...Object.values(ColorSpace)),
    transfer_characteristics: Joi.string().valid(...Object.values(TransferCharacteristics)),
    aspect_ratio: aspectRatioValidator,
    pixel_aspect_ratio: aspectRatioValidator,
    component_type: Joi.string().valid(...Object.values(ComponentType)),
    horiz_chroma_subs: Joi.number().min(1),
    vert_chroma_subs: Joi.number().min(1),
    unc_parameters: Joi.object<VideoFlow['essence_parameters']['unc_parameters']>({
        unc_type: Joi.string().valid(...Object.values(VideoUNCType)).required(),
    }),
    avc_parameters: Joi.object<VideoFlow['essence_parameters']['avc_parameters']>({
        profile: Joi.number().required(),
        level: Joi.number().required(),
        flags: Joi.number().required(),
    })
});

export const audioEssenceParametersValidator = Joi.object<AudioFlow['essence_parameters']>({
    sample_rate: Joi.number().min(1).required(),
    channels: Joi.number().min(1).required(),
    bit_depth: Joi.number().min(1),
    codec_parameters: Joi.object<AudioFlow['essence_parameters']['codec_parameters']>({
        coded_frame_size: Joi.number(),
        mp4_oti: Joi.number(),
    }),
    unc_parameters: Joi.object<AudioFlow['essence_parameters']['unc_parameters']>({
        unc_type: Joi.string().valid(...Object.values(AudioUNCType)).required(),
    })
});

export const imageEssenceParametersValidator = Joi.object<ImageFlow['essence_parameters']>({
    frame_width: Joi.number().min(1).required(),
    frame_height: Joi.number().min(1).required(),
    aspect_ratio: aspectRatioValidator,
});

export const dataEssenceParametersValidator = Joi.object<DataFlow['essence_parameters']>({
    data_type: Joi.string(),
});

export const flowValidator = Joi.object<Flow>({
    id: Joi.string().uuid().required(),
    source_id: Joi.string().uuid().required(),
    label: Joi.string(),
    description: Joi.string(),
    created_by: Joi.string(),
    updated_by: Joi.string(),
    tags: Joi.object().pattern(Joi.string(), Joi.string()),
    metadata_version: Joi.string(),
    generation: Joi.number().min(0),
    created: Joi.date(),
    metadata_updated: Joi.date(),
    segments_updated: Joi.date(),
    read_only: Joi.boolean(),
    codec: codecValidator.required(),
    container: codecValidator,
    avg_bit_rate: Joi.number().min(0),
    max_bit_rate: Joi.number().min(0),
    segment_duration: fractionValidator,
    timerange: timerangeValidator,
    flow_collection: Joi.array().items(flowCollectionItemValidator),
    collected_by: Joi.array().items(Joi.string()),
    container_mapping: containerMappingValidator,
    format: Joi.string().valid(...Object.values(FormatUrn)).required(),
    essence_parameters: Joi.when('format', {
        switch: [
            { is: FormatUrn.VIDEO, then: videoEssenceParametersValidator.required() },
            { is: FormatUrn.AUDIO, then: audioEssenceParametersValidator.required() },
            { is: FormatUrn.IMAGE, then: imageEssenceParametersValidator.required() },
            { is: FormatUrn.DATA, then: dataEssenceParametersValidator.required() },
        ],
        otherwise: Joi.forbidden(),
    })
});

export const flowsValidator = Joi.array().items(flowValidator);
