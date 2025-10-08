// Database configParser
export interface DynamoDBConfig {
    type: 'dynamodb';
    flowTableName: string;
    serviceTableName: string;
    region?: string;
    endpoint?: string;
}

export interface MemoryDBConfig {
    type: 'memory';
}

export type DBConfig = DynamoDBConfig | MemoryDBConfig;

// Backend configParser
interface CommonBackendConfig {
    id: string;
    default?: boolean;
}

export interface S3BackendConfig extends CommonBackendConfig {
    type: 's3';
    bucketName: string;
    region?: string;
    endpoint?: string;
}

export type BackendConfig = S3BackendConfig;

// Log configParser
export interface LogConfig {
    level: 'debug' | 'info' | 'warn' | 'error';
}

export interface Config {
    database: DBConfig;
    backends: BackendConfig[];
    logs: LogConfig;
}
