import { MediaObject, MediaObjectsRepository } from '../mediaObjects';

export class MemoryMediaObjectImpl implements MediaObjectsRepository {
    private readonly mediaObjects: MediaObject[] = [];

    constructor() {
        this.mediaObjects = [];
    }

    async getMediaObjectById(id: string): Promise<MediaObject | null> {
        return this.mediaObjects.find((mo) => mo.objectId === id) ?? null;
    }

    async putMediaObject(mediaObject: MediaObject): Promise<MediaObject> {
        const index = this.mediaObjects.findIndex((findMediaObject) => findMediaObject.objectId === mediaObject.objectId);
        if (index === -1) {
            this.mediaObjects.push(mediaObject);
        } else {
            this.mediaObjects[index] = mediaObject;
        }
        return mediaObject;
    }

}
