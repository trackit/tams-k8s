import { createLogger, format, transports } from 'winston';
import { readConfig } from "../config/reader";

const config = readConfig();

export const log = createLogger({
    transports: [
        new transports.Console()
    ],
    format: format.simple(),
    level: config.logs.level
});

