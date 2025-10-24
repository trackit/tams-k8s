import Joi from 'joi';
import { BackendConfig, Config, DBConfig, DynamoDBConfig, LogConfig, S3BackendConfig, ServerConfig } from './type';

export const dynamoDbDatabaseConfigValidator = Joi.object<DynamoDBConfig>({
    type: Joi.string().valid('dynamodb').required(),
    flowTableName: Joi.string().required(),
    serviceTableName: Joi.string().required(),
    mediaObjectTableName: Joi.string().required(),
    region: Joi.string(),
    endpoint: Joi.string(),
});

export const databaseConfigValidator = Joi.object<DBConfig>({
    type: Joi.string().valid('memory', 'dynamodb').required(),
})
    .when('.type', {
        switch: [
            { is: 'dynamodb', then: dynamoDbDatabaseConfigValidator.required() },
            { is: 'memory', then: Joi.object({}) },
        ],
        otherwise: Joi.forbidden(),
    });

export const s3BackendConfigValidator = Joi.object<S3BackendConfig>({
    type: Joi.string().valid('s3').required(),
    bucketName: Joi.string().required(),
    region: Joi.string(),
    endpoint: Joi.string(),
});

export const backendConfigValidator = Joi.object<BackendConfig>({
    id: Joi.string().uuid().required(),
    type: Joi.string().valid('s3').required(),
    default: Joi.boolean(),
})
    .when('.type', {
        switch: [
            { is: 's3', then: s3BackendConfigValidator.required() },
        ],
        otherwise: Joi.forbidden(),
    });

export const logsConfigValidator = Joi.object<LogConfig>({
    level: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
});

export const serverConfigValidator = Joi.object<ServerConfig>({
    port: Joi.number().min(1).max(65535).default(3000),
});

export const configValidator = Joi.object<Config>({
    database: databaseConfigValidator.required(),
    backends: Joi
        .array<BackendConfig>().items(backendConfigValidator)
        .min(1)
        .unique('id')
        .required(),
    logs: logsConfigValidator.required(),
    server: serverConfigValidator.required(),
});
