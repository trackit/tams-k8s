export interface MediaObject {
    objectId: string;
    storageId: string;
    flowId: string;
    expiresAt: string | Date;
}

export interface MediaObjectsRepository {
    putMediaObject(mo: MediaObject): Promise<MediaObject>;
    getMediaObjectById(id: string): Promise<MediaObject | null>;
}
