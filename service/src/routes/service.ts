import { Request, Response } from 'express'
import Joi from "joi";
import { RepositoriesBuilder } from "../repository/builder";
import { Routes } from "./generic";
import { validator } from "./validationErrorHandler";

export interface GetServiceResponse {
    name: string;
    description: string;
    api_version: string;
    service_version: string;
}

export interface UpdateServiceRequest {
    name: string;
    description?: string;
}

const updateServiceRequestValidator = Joi.object<UpdateServiceRequest>({
    name: Joi.string().required(),
    description: Joi.string(),
}).required();

export class ServiceRoutes extends Routes {
    constructor(repositories: RepositoriesBuilder) {
        super(repositories);

        this.route.get('/', this.get.bind(this));
        this.route.post('/', validator.body(updateServiceRequestValidator), this.update.bind(this));
    }

    private async get(_: Request, res: Response<GetServiceResponse>) {
        const serviceRepo = this.repositories.getServiceRepository();
        const { name, description } = await serviceRepo.getService();
        res.json({
            name,
            description,
            api_version: '1.0',
            service_version: 'tams.1.10.0-da88b8b'
        })
    }

    private async update(req: Request<any, any, UpdateServiceRequest>, res: Response) {
        const serviceRepo = this.repositories.getServiceRepository();
        await serviceRepo.updateService({
            name: req.body.name,
            description: req.body.description || '',
        });
        res.sendStatus(204);
    }
}
