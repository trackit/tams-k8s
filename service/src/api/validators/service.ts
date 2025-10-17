import { StorageBackend } from '@tams-k8s/api';
import Joi from 'joi';

export const storageBackendValidator = Joi.object<StorageBackend>({
    id: Joi.string().uuid().required(),
    label: Joi.string(),
    store_type: Joi.string().required(),
    store_product: Joi.string().required(),
    provider: Joi.string().required(),
    region: Joi.string(),
    availability_zone: Joi.string(),
    default_storage: Joi.boolean(),
});

export const storageBackendsValidator = Joi.array<StorageBackend>().items(storageBackendValidator);
