// Database config
export interface DynamoDBConfig {
    type: 'dynamodb';
    flowTableName: string;
    serviceTableName: string;
    sourceTableName: string;
    region?: string;
    endpoint?: string;
}

export interface MemoryDBConfig {
    type: 'memory';
}

export type DBConfig = DynamoDBConfig | MemoryDBConfig;

// Backend config
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

// Log config
export interface LogConfig {
    level: 'debug' | 'info' | 'warn' | 'error';
}

// Server config
export interface ServerConfig {
    port: number;
}

export interface Config {
    database: DBConfig;
    backends: BackendConfig[];
    logs: LogConfig;
    server: ServerConfig;
}
