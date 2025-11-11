import { Flow, FormatUrn } from '@tams-k8s/api';

export class ApiFlowMother {
    private readonly flow: Flow;

    static video() {
        return new ApiFlowMother({
            id: '9dcb821f-df7a-446c-8881-ec4ec5e4f4fd',
            source_id: '4f330d5f-398a-4ee9-a3a1-741c712d2976',
            format: FormatUrn.VIDEO,
            codec: 'video/mp4',
            essence_parameters: {
                frame_width: 1920,
                frame_height: 1080,
            }
        })
    }

    withId(id: string) {
        this.flow.id = id;

        return this;
    }

    build(): Flow {
        return this.flow;
    }

    constructor(flow: Flow) {
        this.flow = flow;
    }
}

