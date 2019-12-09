import { Logger } from "@arkecosystem/core-interfaces";
import { AbstractLogger } from "@arkecosystem/core-logger";
import pino, { PrettyOptions } from "pino";
import PinoPretty from "pino-pretty";
import pump from "pump";
import { Transform } from "readable-stream";
import split from "split2";
import { PassThrough } from "stream";

export class PinoLogger extends AbstractLogger {
    protected logger: pino.Logger;

    public make(): Logger.ILogger {
        const stream: PassThrough = new PassThrough();
        this.logger = pino(
            {
                // tslint:disable-next-line: no-null-keyword
                base: null,
                safe: true,
                level: "trace",
            },
            stream,
        );

        const consoleTransport = this.createPrettyTransport(this.options.levels.console, { colorize: true });

        pump(stream, split(), consoleTransport, process.stdout);

        return this;
    }

    protected getLevels(): Record<string, string> {
        return {
            verbose: "trace",
        };
    }

    private createPrettyTransport(level: string, prettyOptions?: PrettyOptions): Transform {
        const pinoPretty: PinoPretty = PinoPretty({
            ...{
                levelFirst: false,
                translateTime: "yyyy-mm-dd HH:MM:ss.l",
            },
            ...prettyOptions,
        });

        const levelValue = this.logger.levels.values[level];

        return new Transform({
            transform(chunk, enc, cb) {
                try {
                    const json = JSON.parse(chunk);

                    if (json.level >= levelValue) {
                        const line = pinoPretty(json);

                        if (line !== undefined) {
                            return cb(undefined, line);
                        }
                    }
                } catch (ex) {
                    //
                }

                return cb();
            },
        });
    }
}
