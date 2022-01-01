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
                type: config.type || "multiFile",
                filename: path.resolve(rootPath, "./logs/cheese.log"),
                category: config.category || "cheese",
                // 日志文件按日期（天）切割
                pattern: "yyyy-MM-dd",
                // 回滚旧的日志文件时，保证以 .log 结尾 （只有在 alwaysIncludePattern 为 false 生效）
                keepFileExt: true,
                // 输出的日志文件名是都始终包含 pattern 日期结尾
                alwaysIncludePattern: true,
                timeout: config.timeout || 20
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