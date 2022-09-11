import "reflect-metadata";
import * as log4js from "log4js";
import * as path from "path";
import { IConfigLog } from "../config/IConfigLog";
import { GetConfig } from "../config";
import { Logger as Log4js } from "log4js";
import { AppService, createInstance } from "../core/Module";
import { CONST_DECORATOR_FOR_MODULE_INSTANCEID } from "../data";
import utils from "../utils/utils";

@AppService
export class SevLogger {

    public logger!: Log4js;

    @GetConfig("Log")
    private config: IConfigLog;

    constructor() {
        let logger: any = null;
        Object.defineProperty(this, "logger", {
            get: () => {
                if(!logger) {
                const rootPath = path.resolve(process.cwd(), this.config?.savePath || "");
                log4js.configure({
                    appenders: {
                        console: {
                            type: "console"
                        },
                        cheeseLogs: {
                            type: this.config?.type || "multiFile",
                            filename: path.resolve(rootPath, "./logs/cheese.log"),
                            category: this.config?.category || "cheese",
                            // 日志文件按日期（天）切割
                            pattern: "yyyy-MM-dd",
                            // 回滚旧的日志文件时，保证以 .log 结尾 （只有在 alwaysIncludePattern 为 false 生效）
                            keepFileExt: true,
                            // 输出的日志文件名是都始终包含 pattern 日期结尾
                            alwaysIncludePattern: true,
                            timeout: this.config?.timeout || 20
                        }
                    },
                    categories: {
                        default: {appenders: ['console', 'cheeseLogs'], level: this.config?.level || "info" }
                    }
                });
                logger = log4js.getLogger("cheese");
                console.log("=========", rootPath);
                return logger;
            } else {
                return logger;
            }
            }
        });
    }
}

export const GetLogger = (target: any, attribute?: string): any => {
    if(!utils.isEmpty(attribute)) {
        Object.defineProperty(target, attribute, {
            configurable: false,
            enumerable: true,
            get: () => {
                const instanceId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, target);
                const application = createInstance(SevLogger, instanceId);
                return application.logger;
            },
            set: () => {
                throw new Error("装饰器绑定属性不允许修改。")
            }
        });
    } else {
        const instanceId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, target);
        const application = createInstance(SevLogger, instanceId);
        return application.logger;
    }
}

export { Logger } from "log4js";