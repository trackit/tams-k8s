import type { Config } from "./type";

export const readConfig = (): Config => {
    return {
        database: {
            type: 'dynamodb',
            flowTtableName: 'k8s-tams-test',
            serviceTableName: 'k8s-tams-test-service',
            sourceTableName: 'k8s-tams-test-source',
        },
        // database: {
        //     type: 'memory'
        // },
        backends: [{
            type: 's3',
            id: 'bucket',
            bucketName: 'k8s-tams-test',
            default: true,
        }],
        logs: {
            level: 'debug'
        }
    }
}
