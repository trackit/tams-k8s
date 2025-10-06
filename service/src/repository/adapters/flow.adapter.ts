import {
    CommonFlow as ApiCommonFlow,
    ContainerMapping as ApiContainerMapping,
    Flow as ApiFlow,
    FlowCollectionItem as ApiFlowCollectionIem,
    VideoFlow as ApiVideoFlow,
    ImageFlow as ApiImageFlow,
    AudioFlow as ApiAudioFlow,
    DataFlow as ApiDataFlow,
    FormatUrn,
} from "@tams-k8s/api";
import {
    CommonFlow as RepositoryCommonFlow,
    ContainerMapping as RepositoryContainerMapping,
    Flow as RepositoryFlow,
    FlowCollectionItem as RepositoryFlowCollectionItem,
    VideoFlow as RepositoryVideoFlow,
    ImageFlow as RepositoryImageFlow,
    AudioFlow as RepositoryAudioFlow,
    DataFlow as RepositoryDataFlow,
} from "../flows";

export class FlowAdapter {
    private static fromApiContainerMapping(containerMapping: ApiContainerMapping): RepositoryContainerMapping {
        return {
            trackIndex: containerMapping.track_index,
            formatTrackIndex: containerMapping.format_track_index,
            audioTrack: containerMapping.audio_track ? ({
                channelNumbers: containerMapping.audio_track.channel_numbers,
                channelRange: containerMapping.audio_track.channel_range,
            }) : undefined,
            mp2tsContainer: containerMapping.mp2ts_container ? ({
                pid: containerMapping.mp2ts_container.pid,
            }) : undefined,
            mxfContainer: containerMapping.mxf_container ? ({
                packageUid: containerMapping.mxf_container.package_uid,
                trackId: containerMapping.mxf_container.track_id,
            }) : undefined,
            isobmffContainer: containerMapping.isobmff_container ? ({
                trackId: containerMapping.isobmff_container.track_id,
            }) : undefined,
        }
    }

    private static fromApiFlowCollection(flowCollection: ApiFlowCollectionIem): RepositoryFlowCollectionItem {
        return {
            id: flowCollection.id,
            role: flowCollection.role,
            containerMapping: flowCollection.container_mapping ? FlowAdapter.fromApiContainerMapping(flowCollection.container_mapping) : undefined,
        }
    }

    private static fromApiCommon(common: ApiCommonFlow): RepositoryCommonFlow {
        return {
            id: common.id,
            sourceId: common.source_id,
            label: common.label,
            description: common.description,
            createdBy: common.created_by,
            updatedBy: common.updated_by,
            tags: common.tags,
            metadataVersion: common.metadata_version,
            generation: common.generation,
            created: common.created,
            metadataUpdated: common.metadata_updated,
            segmentsUpdated: common.segments_updated,
            readOnly: common.read_only,
            codec: common.codec,
            container: common.container,
            avgBitRate: common.avg_bit_rate,
            maxBitRate: common.max_bit_rate,
            segmentDuration: common.segment_duration,
            timerange: common.timerange,
            flowCollection: common.flow_collection?.map(FlowAdapter.fromApiFlowCollection),
            collectedBy: common.collected_by,
            containerMapping: common.container_mapping ? FlowAdapter.fromApiContainerMapping(common.container_mapping) : undefined,
        }
    }

    private static fromVideoFlowEssence(videoFlow: ApiVideoFlow['essence_parameters']): RepositoryVideoFlow['essenceParameters'] {
        return {
            frameRate: videoFlow.frame_rate,
            frameWidth: videoFlow.frame_width,
            frameHeight: videoFlow.frame_height,
            bitDepth: videoFlow.bit_depth,
            interlaceMode: videoFlow.interlace_mode,
            colorspace: videoFlow.colorspace,
            transferCharacteristics: videoFlow.transfer_characteristics,
            aspectRatio: videoFlow.aspect_ratio,
            pixelAspectRatio: videoFlow.aspect_ratio,
            componentType: videoFlow.component_type,
            horizChromaSubs: videoFlow.horiz_chroma_subs,
            vertChromaSubs: videoFlow.vert_chroma_subs,
            uncParameters: videoFlow.unc_parameters ? ({
                uncType: videoFlow.unc_parameters.unc_type,
            }) : undefined,
            avcParameters: videoFlow.avc_parameters ? ({
                profile: videoFlow.avc_parameters.profile,
                level: videoFlow.avc_parameters.level,
                flags: videoFlow.avc_parameters.flags,
            }) : undefined
        }
    }

    private static fromImageFlowEssence(imageFlow: ApiImageFlow['essence_parameters']): RepositoryImageFlow['essenceParameters'] {
        return {
            frameWidth: imageFlow.frame_width,
            frameHeight: imageFlow.frame_height,
            aspectRatio: imageFlow.aspect_ratio,
        }
    }

    private static fromAudioFlowEssence(audioFlow: ApiAudioFlow['essence_parameters']): RepositoryAudioFlow['essenceParameters'] {
        return {
            sampleRate: audioFlow.sample_rate,
            channels: audioFlow.channels,
            bitDepth: audioFlow.bit_depth,
            codecParameters: audioFlow.codec_parameters ? ({
                codedFrameSize: audioFlow.codec_parameters.coded_frame_size,
                mp4Oti: audioFlow.codec_parameters.mp4_oti,
            }) : undefined,
            uncParameters: audioFlow.unc_parameters ? ({
                uncType: audioFlow.unc_parameters.unc_type,
            }) : undefined
        }
    }

    private static fromDataFlowEssence(dataFlow: ApiDataFlow['essence_parameters']): RepositoryDataFlow['essenceParameters'] {
        return {
            dataType: dataFlow.data_type,
        }
    }

    static fromApi(flow: ApiFlow): RepositoryFlow {
        const common = FlowAdapter.fromApiCommon(flow);
        switch (flow.format) {
            case FormatUrn.VIDEO:
                return {
                    ...common,
                    format: flow.format,
                    essenceParameters: FlowAdapter.fromVideoFlowEssence(flow.essence_parameters)
                }
            case FormatUrn.IMAGE:
                return {
                    ...common,
                    format: flow.format,
                    essenceParameters: FlowAdapter.fromImageFlowEssence(flow.essence_parameters)
                }
            case FormatUrn.AUDIO:
                return {
                    ...common,
                    format: flow.format,
                    essenceParameters: FlowAdapter.fromAudioFlowEssence(flow.essence_parameters)
                }
            case FormatUrn.DATA:
                return {
                    ...common,
                    format: flow.format,
                    essenceParameters: FlowAdapter.fromDataFlowEssence(flow.essence_parameters)
                };
            case FormatUrn.MULTI:
                return {
                    ...common,
                    format: flow.format,
                }
        }
    }
}
