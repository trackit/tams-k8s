import Joi from 'joi';
import { Request, Response } from 'express'
import { ValidatedRequest } from 'express-joi-validation';
import { GetServiceResponse, StorageBackends, PostServiceRequest, storageBackendsValidator } from '@tams-k8s/api';
import { BackendManager } from '../backend/manager';
import { RepositoriesBuilder } from '../repository/builder';
import { Routes } from './generic';
import { BodySchema, validator } from './middlewares';

const updateServiceRequestValidator = Joi.object<PostServiceRequest>({
    name: Joi.string().required(),
    description: Joi.string(),
}).required();

export class ServiceRoutes extends Routes {
    constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
        super(repositories, backends);

        this.route.get('/', this.get.bind(this));
        this.route.post('/', validator.body(updateServiceRequestValidator), this.update.bind(this));
        this.route.get('/storage-backends', validator.response(storageBackendsValidator), this.getStorageBackends.bind(this));
    }

    private async get(_: Request, res: Response<GetServiceResponse>) {
        const serviceRepo = this.repositories.getServiceRepository();
        const { name, description } = await serviceRepo.getService();
        res.json({
            name,
            description,
            api_version: '1.0',
            service_version: 'tams.7.0-b831a15',
            type: 'urn:x-tams:service.example',
            event_stream_mechanisms: []
        })
    }

    private async update(req: ValidatedRequest<BodySchema<PostServiceRequest>>, res: Response) {
        const serviceRepo = this.repositories.getServiceRepository();
        await serviceRepo.updateService({
            name: req.body.name,
            description: req.body.description,
        });
        res.sendStatus(204);
    }

    private async getStorageBackends(_: Request, res: Response<StorageBackends>) {
        res.json(await Promise.all(this.backends.getBackends().map(async (backend) => {
            const info = await backend.getBucketInformation();
            return {
                id: backend.getId(),
                label: info.label,
                provider: info.provider,
                store_type: info.storeType,
                store_product: info.storeProduct,
                region: info.region,
                availability_zone: info.availabilityZone,
                ...(backend.isDefault() ? { default_storage: true } : {})
            }
        })));
    }
}
