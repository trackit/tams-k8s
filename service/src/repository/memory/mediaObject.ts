import { MediaObject, MediaObjectsRepository } from '../mediaObjects';

export class MemoryMediaObjectImpl implements MediaObjectsRepository {
    private readonly mediaObjects: MediaObject[] = [];

    constructor() {
        this.mediaObjects = [];
    }

    async getMediaObjectById(id: string): Promise<MediaObject | null> {
        return this.mediaObjects.find((mo) => mo.objectId === id) ?? null;
    }

    async putMediaObject(mo: MediaObject): Promise<MediaObject> {
        const index = this.mediaObjects.findIndex((mo) => mo.objectId === mo.objectId);
        if (index === -1) {
            this.mediaObjects.push(mo);
        } else {
            this.mediaObjects[index] = mo;
        }
        return mo;
    }

}
