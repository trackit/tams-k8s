import Joi from 'joi';
import { Config, DynamoDBConfig } from './type';

export const dynamoDbDatabaseConfigValidator = Joi.object<DynamoDBConfig>({
    type: Joi.string().valid('dynamodb').required(),
    flowTableName: Joi.string().required(),
    serviceTableName: Joi.string().required(),
    region: Joi.string(),
    endpoint: Joi.string(),
});

export const databaseConfigValidator = Joi.object<Config['database']>({
    type: Joi.string().valid('memory', 'dynamodb'),
})
    .when('.type', {
        switch: [
            { is: 'dynamodb', then: dynamoDbDatabaseConfigValidator.required() },
            { is: 'memory', then: Joi.object({}) },
        ],
        otherwise: Joi.forbidden(),
    });

export const logsConfigValidator = Joi.object<Config['logs']>({
    level: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
});

export const configValidator = Joi.object<Config>({
    database: databaseConfigValidator.required(),
    logs: logsConfigValidator.required(),
});
