// Database config
export interface DynamoDBConfig {
    type: 'dynamodb'
    flowTtableName: string
    serviceTableName: string;
    region?: string
    endpoint?: string
}

export interface MemoryDBConfig {
    type: 'memory'
}

export type DBConfig = DynamoDBConfig | MemoryDBConfig;

// Backend config
export interface S3BackendConfig {
    type: 's3'
    bucket: string
    region?: string
    endpoint?: string
}

export type BackendConfig = S3BackendConfig;

// Log config
export interface LogConfig {
    level: 'debug' | 'info' | 'warn' | 'error'
}

export interface Config {
    database: DBConfig;
    backend: BackendConfig;
    logs: LogConfig
}
