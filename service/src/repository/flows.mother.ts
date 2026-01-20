import { FormatUrn } from "@tams-k8s/api";
import { Flow, VideoFlow } from "./flows";

export class RepoFlowMother {
  private readonly flow: Flow;

  static video(id?: string) {
    return new RepoFlowMother({
      flowId: id ?? "9dcb821f-df7a-446c-8881-ec4ec5e4f4fd",
      sourceId: "4f330d5f-398a-4ee9-a3a1-741c712d2976",
      format: FormatUrn.VIDEO,
      codec: "video/mp4",
      essenceParameters: {
        frameWidth: 1920,
        frameHeight: 1080,
      },
    });
  }

  static audio(id?: string) {
    return new RepoFlowMother({
      flowId: id ?? "518f14c2-f940-4035-86ae-a34c16d47b3d",
      sourceId: "ae7bcaaa-c145-40bc-a12f-0353d6bd53e3",
      format: FormatUrn.AUDIO,
      codec: "audio/mp3",
      essenceParameters: {
        sampleRate: 44100,
        channels: 2,
      },
    });
  }

  withId(id: string) {
    this.flow.flowId = id;
    return this;
  }

  withCodec(codec: string) {
    this.flow.codec = codec;
    return this;
  }

  withSourceId(sourceId: string) {
    this.flow.sourceId = sourceId;
    return this;
  }

  withReadOnly(readOnly: boolean) {
    this.flow.readOnly = readOnly;
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

  withFrameWidth(frameWidth: number) {
    if (this.flow.format !== FormatUrn.VIDEO) {
      throw new Error("Current flow is not a video");
    }
    if (!("essenceParameters" in this.flow)) {
      throw new Error("essenceParameters is not defined for this flow");
    }
    (this.flow as VideoFlow).essenceParameters.frameWidth = frameWidth;
    return this;
  }

  withFrameHeight(frameHeight: number) {
    if (this.flow.format !== FormatUrn.VIDEO) {
      throw new Error("Current flow is not a video");
    }
    if (!("essenceParameters" in this.flow)) {
      throw new Error("essenceParameters is not defined for this flow");
    }
    (this.flow as VideoFlow).essenceParameters.frameHeight = frameHeight;
    return this;
  }

  withVideoEssenceParameters(
    essenceParameters: VideoFlow["essenceParameters"]
  ) {
    if (this.flow.format !== FormatUrn.VIDEO) {
      throw new Error("Current flow is not a video");
    }
    this.flow.essenceParameters = essenceParameters;
    return this;
  }

  build(): Flow {
    return this.flow;
  }

  constructor(flow: Flow) {
    this.flow = flow;
  }
}
