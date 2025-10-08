import { log } from '@tams-k8s/logger';
import { readFileSync } from 'fs';
import YAML from 'yaml';
import { ConfigParserError } from './error';
import type { Config } from './type';
import { configValidator } from './validator';

export const readConfig = (): Config => {
    return {
        database: {
            type: 'dynamodb',
            flowTableName: 'k8s-tams-test',
            serviceTableName: 'k8s-tams-test-service',
        },
        // database: {
        //     type: 'memory'
        // },
        backends: [{
            type: 's3',
            id: '0bdaaf7b-fa77-4f78-928c-df8ce71845e3',
            bucketName: 'k8s-tams-test',
            default: true,
        }],
        logs: {
            level: 'debug'
        }
    };
};

export class ConfigReader {
    private parsedConfig: Record<string, any> | undefined;

    constructor(private readonly path?: string) {

    }

    private readConfigFile() {
        if (this.path) {
            const configFile = readFileSync(this.path, 'utf8');
            switch (this.path.split('.').slice(-1)[0]) {
                case 'json':
                    this.parsedConfig = JSON.parse(configFile);
                    break;
                case 'yaml':
                case 'yml':
                    this.parsedConfig = YAML.parse(configFile);
                    break;
                default:
                    log.warn('Unknown config file type, ignoring configuration', { path: this.path });
            }
        }
    }

    private parseKey(keyPath: string[], defaultValue?: string): any {
        const cliKey = `--${keyPath.join('-').replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}=`;
        for (const arg of process.argv) {
            if (arg.startsWith(cliKey)) {
                return arg.slice(cliKey.length);
            }
        }
        const envKey = `TAMS_${keyPath.join('_').replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toUpperCase()}`;
        if (process.env[envKey]) {
            return process.env[envKey];
        }
        if (this.parsedConfig) {
            const value = keyPath.reduce((obj, key) => obj?.[key], this.parsedConfig);
            if (value) {
                return value;
            }
        }
        return defaultValue;
    }

    private parseArray(keyPath: string[]): Array<any> {
        const singularKeyPath: string[] = [
            ...keyPath.slice(0, -1), // add all elements except the last one
            ...keyPath.slice(-1)[0].slice(-1) === 's' // if last element ends with 's'
                ? [keyPath.slice(-1)[0].slice(0, -1)] // remove last 's'
                : keyPath.slice(-1) // otherwise keep last element as is
        ];
        const cliKey = `--${singularKeyPath.join('-').replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}=`;
        let arr: Array<any> | undefined = undefined;
        for (const arg of process.argv) {
            if (arg.startsWith(cliKey)) {
                arr = arr || [];
                arr.push(JSON.parse(arg.slice(cliKey.length)));
            }
        }
        if (arr) {
            return arr;
        }
        const envKey = `TAMS_${keyPath.join('_').replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toUpperCase()}`;
        if (process.env[envKey]) {
            const parsedFromEnv = JSON.parse(process.env[envKey]);
            if (Array.isArray(parsedFromEnv)) return parsedFromEnv;
            return [];
        }
        if (this.parsedConfig) {
            const value = keyPath.reduce((obj, key) => obj?.[key], this.parsedConfig);
            if (value && Array.isArray(value)) {
                return value;
            }
        }
        return [];
    }

    private parseDatabaseBlock(): { [k: string]: any } {
        const type = this.parseKey(['database', 'type']);
        switch (type) {
            case 'dynamodb':
                return {
                    type,
                    flowTableName: this.parseKey(['database', 'flowTableName']),
                    serviceTableName: this.parseKey(['database', 'serviceTableName']),
                    region: this.parseKey(['database', 'region']),
                    endpoint: this.parseKey(['database', 'endpoint']),
                };
            case 'memory':
                return {
                    type,
                };
            default:
                return {
                    type
                };
        }
    }

    private parseBackendsBlock(): Array<{ [k: string]: any }> {
        const backends = this.parseArray(['backends']);
        return backends.map((backend: any) => {
            console.log(backend.type);
            const type = backend.type;
            switch (type) {
                case 's3':
                    return {
                        type: backend.type,
                        id: backend.id,
                        bucketName: backend.bucketName,
                        default: backend.default,
                        region: backend.region,
                        endpoint: backend.endpoint,
                    };
                default:
                    return {
                        type: backend.type
                    };
            }
        });
    }

    private parseLogsBlock(): { [k: string]: any } {
        return {
            level: this.parseKey(['logs', 'level'], 'info') as Config['logs']['level'],
        };
    }

    getConfig() {
        this.readConfigFile();
        const config = {
            database: this.parseDatabaseBlock(),
            backends: this.parseBackendsBlock(),
            logs: this.parseLogsBlock(),
        };
        console.log(config, configValidator.validate(config));
    }
}

new ConfigReader('./config/default.yaml').getConfig();
