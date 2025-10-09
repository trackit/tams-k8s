import { createLogger, format, transports } from 'winston';
import { ConfigReader } from "../configParser/reader";

const config = new ConfigReader().getCachedConfig();

export const log = createLogger({
    transports: [
        new transports.Console()
    ],
    format: format.simple(),
    level: config.logs.level ?? 'info'
});
