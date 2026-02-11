import { createLogger as createWinstonLogger, format, transports } from "winston"

export function createLogger(name: string) {
    return createWinstonLogger({
        level: "info",
        format: format.combine(
            format.timestamp(),
            format.json()
        ),
        defaultMeta: { service: name },
        transports: [
            new transports.File({ filename: `logs/${name}-error.log`, level: "error" }),
            new transports.File({ filename: `logs/${name}-combined.log` }),
            new transports.Console({
                format: format.combine(
                    format.colorize(),
                    format.simple()
                )
            })
        ]
    })
}