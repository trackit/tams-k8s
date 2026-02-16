import { Flow, VideoFlow, FormatUrn } from '@tams-k8s/api';
import { FlowAdapter } from '../../repository/adapters/flow.adapter';
import { Flow as RepositoryFlow } from '../../repository/flows';

export class ApiFlowMother {
    private readonly flow: Flow;

    static video(id?: string) {
        return new ApiFlowMother({
            id: id ?? '9dcb821f-df7a-446c-8881-ec4ec5e4f4fd',
            source_id: '4f330d5f-398a-4ee9-a3a1-741c712d2976',
            format: FormatUrn.VIDEO,
            codec: 'video/mp4',
            essence_parameters: {
                frame_width: 1920,
                frame_height: 1080,
            }
        })
    }

    static audio(id?: string) {
        return new ApiFlowMother({
            id: id ?? '518f14c2-f940-4035-86ae-a34c16d47b3d',
            source_id: 'ae7bcaaa-c145-40bc-a12f-0353d6bd53e3',
            format: FormatUrn.AUDIO,
            codec: 'audio/mp3',
            essence_parameters: {
                sample_rate: 44100,
                channels: 2,
            },
        });
    }

    withId(id: string) {
        this.flow.id = id;

        return this;
    }

    withCodec(codec: string) {
        this.flow.codec = codec;
        return this;
    }

    withSourceId(sourceId: string) {
        this.flow.source_id = sourceId;
        return this;
    }

    withReadOnly(readOnly: boolean) {
        this.flow.read_only = readOnly;
        return this;
    }

    withTags(tags: Record<string, string>) {
        this.flow.tags = tags;
        return this;
    }

    withLabel(label: string) {
        this.flow.label = label;
        return this;
    }

    withVideoEssenceParameters(essenceParameters: VideoFlow['essence_parameters']) {
        if (this.flow.format !== FormatUrn.VIDEO) {
            throw new Error('Current flow is not a video');
        }
        this.flow.essence_parameters = essenceParameters;
        return this;
    }

    build(): Flow {
        return this.flow;
    }

    buildRepoFlow(): RepositoryFlow {
        return FlowAdapter.fromApi(this.flow);
    }

    constructor(flow: Flow) {
        this.flow = flow;
    }
}
