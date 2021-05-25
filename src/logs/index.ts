import * as log4js from "log4js";
import * as path from "path";
import { IConfigLog } from "../config/IConfigLog";
import { getApplicationConfig } from "../config";
import { Logger } from "log4js";

export const getLogger = ():Logger => {
    const rootPath = process.cwd();
    const config: IConfigLog = getApplicationConfig()?.Log;
    log4js.configure({
        appenders: {
            console: {
                type: "console"
            },
            cheeseLogs: {
                type: "file",
                filename: path.resolve(rootPath, "./logs/cheese.log"),
                category: "cheese"
            }
        },
        categories: {
            default: {appenders: ['console', 'cheeseLogs'], level: config?.level || "info" }
        }
    });
    return log4js.getLogger("cheese");
};

export const GetLogger = () => {
    return (target: any, attr: string): void => {
        const config: IConfigLog = getApplicationConfig()?.Log;
        const logger = getLogger();
        Object.defineProperty(target, attr, {
            enumerable: true,
            configurable: false,
            get: () => logger,
            set: () => {
                throw new Error("Can not override the log object");
            }
        });
    };
}