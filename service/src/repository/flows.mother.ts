import { FormatUrn } from '@tams-k8s/api';
import { Flow } from './flows';

export class RepoFlowMother {
    private readonly flow: Flow;

    static video() {
        return new RepoFlowMother({
            flowId: '9dcb821f-df7a-446c-8881-ec4ec5e4f4fd',
            sourceId: '4f330d5f-398a-4ee9-a3a1-741c712d2976',
            format: FormatUrn.VIDEO,
            codec: 'video/mp4',
            essenceParameters: {
                frameWidth: 1920,
                frameHeight: 1080,
            }
        })
    }

    withId(id: string) {
        this.flow.flowId = id;
        return this;
    }

    withCodec(codec: string) {
        this.flow.codec = codec;
        return this;
    }

    withReadOnly(readOnly: boolean) {
        this.flow.readOnly = readOnly;
        return this;
    }

    build(): Flow {
        return this.flow;
    }

    constructor(flow: Flow) {
        this.flow = flow;
    }
}
