import {
    AudioFlow as ApiAudioFlow,
    CommonFlow as ApiCommonFlow,
    ContainerMapping as ApiContainerMapping,
    DataFlow as ApiDataFlow,
    Flow as ApiFlow,
    FlowCollectionItem as ApiFlowCollectionItem,
    FormatUrn,
    ImageFlow as ApiImageFlow,
    VideoFlow as ApiVideoFlow,
} from "@tams-k8s/api";
import {
    AudioFlow as RepositoryAudioFlow,
    CommonFlow as RepositoryCommonFlow,
    ContainerMapping as RepositoryContainerMapping,
    DataFlow as RepositoryDataFlow,
    Flow as RepositoryFlow,
    FlowCollectionItem as RepositoryFlowCollectionItem,
    ImageFlow as RepositoryImageFlow,
    VideoFlow as RepositoryVideoFlow,
} from "../flows";

export class FlowAdapter {
    // fromAPI
    private static fromContainerMappingApi(containerMapping: ApiContainerMapping): RepositoryContainerMapping {
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

    private static fromFlowCollectionItemApi(flowCollection: ApiFlowCollectionItem): RepositoryFlowCollectionItem {
        return {
            id: flowCollection.id,
            role: flowCollection.role,
            containerMapping: flowCollection.container_mapping ? FlowAdapter.fromContainerMappingApi(flowCollection.container_mapping) : undefined,
        }
    }

    static fromApiFlowCollection(flowCollection: ApiFlowCollectionItem[]): RepositoryFlowCollectionItem[] {
        return flowCollection.map(FlowAdapter.fromFlowCollectionItemApi);
    }

    private static fromCommonApi(common: ApiCommonFlow): RepositoryCommonFlow {
        return {
            flowId: common.id,
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
            flowCollection: common.flow_collection?.map(FlowAdapter.fromFlowCollectionItemApi),
            collectedBy: common.collected_by,
            containerMapping: common.container_mapping ? FlowAdapter.fromContainerMappingApi(common.container_mapping) : undefined,
        }
    }

    private static fromVideoFlowEssenceApi(videoFlow: ApiVideoFlow['essence_parameters']): RepositoryVideoFlow['essenceParameters'] {
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

    private static fromImageFlowEssenceApi(imageFlow: ApiImageFlow['essence_parameters']): RepositoryImageFlow['essenceParameters'] {
        return {
            frameWidth: imageFlow.frame_width,
            frameHeight: imageFlow.frame_height,
            aspectRatio: imageFlow.aspect_ratio,
        }
    }

    private static fromAudioFlowEssenceApi(audioFlow: ApiAudioFlow['essence_parameters']): RepositoryAudioFlow['essenceParameters'] {
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

    private static fromDataFlowEssenceApi(dataFlow: ApiDataFlow['essence_parameters']): RepositoryDataFlow['essenceParameters'] {
        return {
            dataType: dataFlow.data_type,
        }
    }

    static fromApi(flow: ApiFlow): RepositoryFlow {
        const common = FlowAdapter.fromCommonApi(flow);
        switch (flow.format) {
            case FormatUrn.VIDEO:
                return {
                    ...common,
                    format: flow.format,
                    essenceParameters: FlowAdapter.fromVideoFlowEssenceApi(flow.essence_parameters)
                }
            case FormatUrn.IMAGE:
                return {
                    ...common,
                    format: flow.format,
                    essenceParameters: FlowAdapter.fromImageFlowEssenceApi(flow.essence_parameters)
                }
            case FormatUrn.AUDIO:
                return {
                    ...common,
                    format: flow.format,
                    essenceParameters: FlowAdapter.fromAudioFlowEssenceApi(flow.essence_parameters)
                }
            case FormatUrn.DATA:
                return {
                    ...common,
                    format: flow.format,
                    essenceParameters: FlowAdapter.fromDataFlowEssenceApi(flow.essence_parameters)
                };
            case FormatUrn.MULTI:
                return {
                    ...common,
                    format: flow.format,
                }
        }
    }

    // toApi
    private static toApiContainerMapping(containerMapping: RepositoryContainerMapping): ApiContainerMapping {
        return {
            track_index: containerMapping.trackIndex,
            format_track_index: containerMapping.formatTrackIndex,
            audio_track: containerMapping.audioTrack ? ({
                channel_numbers: containerMapping.audioTrack.channelNumbers,
                channel_range: containerMapping.audioTrack.channelRange,
            }) : undefined,
            mp2ts_container: containerMapping.mp2tsContainer ? ({
                pid: containerMapping.mp2tsContainer.pid,
            }) : undefined,
            mxf_container: containerMapping.mxfContainer ? ({
                package_uid: containerMapping.mxfContainer.packageUid,
                track_id: containerMapping.mxfContainer.trackId,
            }) : undefined,
            isobmff_container: containerMapping.isobmffContainer ? ({
                track_id: containerMapping.isobmffContainer.trackId,
            }) : undefined
        }
    }

    private static toApiFlowCollectionItem(flowCollectionItem: RepositoryFlowCollectionItem): ApiFlowCollectionItem {
        return {
            id: flowCollectionItem.id,
            role: flowCollectionItem.role,
            container_mapping: flowCollectionItem.containerMapping ? FlowAdapter.toApiContainerMapping(flowCollectionItem.containerMapping) : undefined,
        }
    }

    static toApiFlowCollection(flowCollection: RepositoryFlowCollectionItem[]): ApiFlowCollectionItem[] {
        return flowCollection.map(FlowAdapter.toApiFlowCollectionItem);
    }

    private static toCommonApi(flow: RepositoryCommonFlow): ApiCommonFlow {
        return {
            id: flow.flowId,
            source_id: flow.sourceId,
            label: flow.label,
            description: flow.description,
            created_by: flow.createdBy,
            updated_by: flow.updatedBy,
            tags: flow.tags,
            metadata_version: flow.metadataVersion,
            generation: flow.generation,
            created: flow.created ? new Date(flow.created) : undefined,
            metadata_updated: flow.metadataUpdated ? new Date(flow.metadataUpdated) : undefined,
            segments_updated: flow.segmentsUpdated ? new Date(flow.segmentsUpdated) : undefined,
            read_only: flow.readOnly,
            codec: flow.codec,
            container: flow.container,
            avg_bit_rate: flow.avgBitRate,
            max_bit_rate: flow.maxBitRate,
            segment_duration: flow.segmentDuration,
            timerange: flow.timerange,
            flow_collection: flow.flowCollection?.map(FlowAdapter.toApiFlowCollectionItem),
            collected_by: flow.collectedBy,
            container_mapping: flow.containerMapping ? FlowAdapter.toApiContainerMapping(flow.containerMapping) : undefined,
        }
    }

    private static toVideoFlowEssenceApi(videoFlow: RepositoryVideoFlow['essenceParameters']): ApiVideoFlow['essence_parameters'] {
        return {
            frame_rate: videoFlow.frameRate,
            frame_width: videoFlow.frameWidth,
            frame_height: videoFlow.frameHeight,
            bit_depth: videoFlow.bitDepth,
            interlace_mode: videoFlow.interlaceMode,
            colorspace: videoFlow.colorspace,
            transfer_characteristics: videoFlow.transferCharacteristics,
            aspect_ratio: videoFlow.aspectRatio,
            pixel_aspect_ratio: videoFlow.pixelAspectRatio,
            component_type: videoFlow.componentType,
            horiz_chroma_subs: videoFlow.horizChromaSubs,
            vert_chroma_subs: videoFlow.vertChromaSubs,
            unc_parameters: videoFlow.uncParameters ? ({
                unc_type: videoFlow.uncParameters.uncType,
            }) : undefined,
            avc_parameters: videoFlow.avcParameters ? ({
                profile: videoFlow.avcParameters.profile,
                level: videoFlow.avcParameters.level,
                flags: videoFlow.avcParameters.flags,
            }) : undefined,
        }
    }

    private static toAudioFlowEssenceApi(audioFlow: RepositoryAudioFlow['essenceParameters']): ApiAudioFlow['essence_parameters'] {
        return {
            sample_rate: audioFlow.sampleRate,
            channels: audioFlow.channels,
            bit_depth: audioFlow.bitDepth,
            codec_parameters: audioFlow.codecParameters ? ({
                coded_frame_size: audioFlow.codecParameters.codedFrameSize,
                mp4_oti: audioFlow.codecParameters.mp4Oti,
            }) : undefined,
            unc_parameters: audioFlow.uncParameters ? ({
                unc_type: audioFlow.uncParameters.uncType,
            }) : undefined,
        }
    }

    private static toImageFlowEssenceApi(imageFlow: RepositoryImageFlow['essenceParameters']): ApiImageFlow['essence_parameters'] {
        return {
            frame_width: imageFlow.frameWidth,
            frame_height: imageFlow.frameHeight,
            aspect_ratio: imageFlow.aspectRatio,
        }
    }

    private static toDataFlowEssenceApi(dataFlow: RepositoryDataFlow['essenceParameters']): ApiDataFlow['essence_parameters'] {
        return {
            data_type: dataFlow.dataType,
        }
    }

    static toApi(flow: RepositoryFlow): ApiFlow {
        switch (flow.format) {
            case FormatUrn.VIDEO:
                return {
                    ...FlowAdapter.toCommonApi(flow),
                    format: flow.format,
                    essence_parameters: FlowAdapter.toVideoFlowEssenceApi(flow.essenceParameters),
                }
            case FormatUrn.AUDIO:
                return {
                    ...FlowAdapter.toCommonApi(flow),
                    format: flow.format,
                    essence_parameters: FlowAdapter.toAudioFlowEssenceApi(flow.essenceParameters),
                }
            case FormatUrn.IMAGE:
                return {
                    ...FlowAdapter.toCommonApi(flow),
                    format: flow.format,
                    essence_parameters: FlowAdapter.toImageFlowEssenceApi(flow.essenceParameters),
                }
            case FormatUrn.DATA:
                return {
                    ...FlowAdapter.toCommonApi(flow),
                    format: flow.format,
                    essence_parameters: FlowAdapter.toDataFlowEssenceApi(flow.essenceParameters),
                }
            case FormatUrn.MULTI:
                return {
                    ...FlowAdapter.toCommonApi(flow),
                    format: flow.format,
                }
        }
    }
}
