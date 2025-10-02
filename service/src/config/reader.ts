import type { Config } from "./type";

export const readConfig = (): Config => {
    return {
        database: {
            type: 'dynamodb',
            flowTtableName: 'k8s-tams-test',
            serviceTableName: 'k8s-tams-test-service',
        },
        // database: {
        //     type: 'memory'
        // },
        backend: {
            type: 's3',
            bucket: 'k8s-tams-test'
        },
        logs: {
            level: 'debug'
        }
    }
}
