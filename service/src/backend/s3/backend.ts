import {
    CreateBucketCommand,
    GetObjectCommand,
    HeadBucketCommand,
    NotFound,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { log } from "@tams-k8s/logger";
import { S3BackendConfig } from "../../configParser";
import { Backend, BucketInformation, GetPresignedUrlMode, GetPresignedUrlOptions } from "../backend";

export class S3BackendImpl implements Backend {
    private readonly client: S3Client;
    private readonly config: S3BackendConfig;

    constructor(config: S3BackendConfig) {
        this.client = new S3Client({
            region: config.region,
            endpoint: config.endpoint
        });
        this.config = config;
    }

    private async createBucket() {
        await this.client.send(new CreateBucketCommand({
            Bucket: this.config.bucketName
        }));
    }

    async initialize(): Promise<void> {
        // ensure bucket exists
        try {
            await this.client.send(new HeadBucketCommand({
                Bucket: this.config.bucketName,
            }));
        } catch (e) {
            if (e instanceof NotFound) {
                log.info('Bucket not found, creating...', { bucketName: this.config.bucketName });
                await this.createBucket();
                log.info('Bucket created', { bucketName: this.config.bucketName });
            } else {
                log.error('Could not verify bucket existence', { bucketName: this.config.bucketName }, e);
                throw e;
            }
        }
    }

    getId() {
        return this.config.id;
    }

    async getPresignedUrl(mode: GetPresignedUrlMode, key: string, opts?: GetPresignedUrlOptions): Promise<string> {
        if (mode === 'GET') {
            return getSignedUrl(
                this.client,
                new GetObjectCommand({
                    Bucket: this.config.bucketName,
                    Key: key,
                }),
                {
                    expiresIn: opts?.expiresIn
                },
            );
        }
        return getSignedUrl(
            this.client,
            new PutObjectCommand({
                Bucket: this.config.bucketName,
                Key: key,
                ContentType: opts?.contentType,
            }),
            {
                signableHeaders: new Set(["content-type"]),
                expiresIn: opts?.expiresIn,
            }
        )
    }

    isDefault(): boolean {
        return this.config.default === true;
    }

    async getBucketInformation(): Promise<BucketInformation> {
        const resp = await this.client.send(new HeadBucketCommand({
            Bucket: this.config.bucketName
        }));
        if (!resp.BucketRegion) {
            throw new Error('Bucket region not found');
        }
        return {
            provider: 'aws',
            label: `aws.${resp.BucketRegion}:s3:${this.config.bucketName}`,
            storeType: 'http_object_store',
            storeProduct: 's3',
            region: resp.BucketRegion,
            availabilityZone: 'n/a',
        }
    }
}
