import { readFileSync } from 'fs';
import YAML from 'yaml';
import { ConfigParserError } from './error';
import type { Config } from './type';
import { configValidator } from './validator';

export class ConfigReader {
    private parsedFile: Record<string, any> | undefined;
    private cachedConfig: Config | undefined;

    private getConfigFilePath(): string | undefined {
        const configPathCliKey = '--config-path=';
        for (const arg of process.argv) {
            if (arg.startsWith(configPathCliKey)) {
                return arg.slice(configPathCliKey.length);
            }
        }
        const configPathEnvKey = 'TAMS_CONFIG_PATH';
        if (process.env[configPathEnvKey]) {
            return process.env[configPathEnvKey];
        }
        return './config/default.yaml';
    }

    private readConfigFile() {
        const path = this.getConfigFilePath();
        if (path) {
            const configFile = readFileSync(path, 'utf8');
            switch (path.split('.').slice(-1)[0]) {
                case 'json':
                    this.parsedFile = JSON.parse(configFile);
                    break;
                case 'yaml':
                case 'yml':
                    this.parsedFile = YAML.parse(configFile);
                    break;
                default:
                    console.warn('Unknown config file type, ignoring configuration', { path });
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
        if (this.parsedFile) {
            const value = keyPath.reduce((obj, key) => obj?.[key], this.parsedFile);
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
        if (this.parsedFile) {
            const value = keyPath.reduce((obj, key) => obj?.[key], this.parsedFile);
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

    private parseServerBlock(): { [k: string]: any } {
        return {
            port: this.parseKey(['server', 'port'], '3000'),
        }
    }

    private validateDefault(conf: Config) {
        let hasOneDefault = false;
        for (const backend of conf.backends) {
            if (backend.default && !hasOneDefault) {
                hasOneDefault = true;
            } else if (backend.default) {
                throw new ConfigParserError('Only one backend can be default');
            }
        }
        if (!hasOneDefault) {
            throw new ConfigParserError('At least one backend must be default');
        }
    }

    getConfig(): Config {
        this.readConfigFile();
        const config = {
            database: this.parseDatabaseBlock(),
            backends: this.parseBackendsBlock(),
            logs: this.parseLogsBlock(),
            server: this.parseServerBlock(),
        };
        const { value, error } = configValidator.validate(config, { convert: true });
        if (error) {
            throw error;
        }
        this.validateDefault(value);
        return value;
    }

    getCachedConfig(): Config {
        if (!this.cachedConfig) {
            this.cachedConfig = this.getConfig();
        }
        return this.cachedConfig;
    }
}
