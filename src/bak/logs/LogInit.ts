import "reflect-metadata";
import * as log4js from "log4js";
import * as path from "path";
import { IConfigLog } from "../config/IConfigLog";
import { GetConfig } from "../config";
import { Logger as Log4js } from "log4js";
import { AppService, createInstance } from "../core/Module";
import { CONST_DECORATOR_FOR_MODULE_INSTANCEID } from "../data";
import { StaticFiles } from "../../utils/StaticFiles";
import utils from "../../utils/utils";

@AppService
export class SevLogger {

    public logger!: Log4js;
    public logPath!: string;

    @GetConfig("Log")
    private config: IConfigLog;

    constructor(
        private fileObj: StaticFiles
    ) {
        let logger: Log4js = null;
        Object.defineProperty(this, "logger", {
            get: () => {
                if(!logger) {
                    const rootPath = path.resolve(process.cwd(), this.config?.savePath || "./logs");
                    const logFileName = path.resolve(rootPath, "./cheese.log");
                    const logPath = this.fileObj.getPath(logFileName);
                    this.logPath = logPath;
                    this.fileObj.checkDir(logPath, process.cwd());
                    log4js.configure({
                        appenders: {
                            console: {
                                type: "console"
                            },
                            cheeseLogs: {
                                type: this.config?.type || "multiFile",
                                filename: logFileName,
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
                    logger.info("Log Path: " + logPath);
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
                const instanceId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, target) ||
                    Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, target.constructor);
                const application = createInstance(SevLogger, instanceId);
                return application.logger;
            },
            set: () => {
                throw new Error("装饰器绑定属性不允许修改。")
            }
        });
    }
    /**
     *  else {
        console.error("---have error---", attribute);
        const instanceId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, target);
        const application = createInstance(SevLogger, instanceId);
        return application.logger;
    }
     */
}

export { Logger } from "log4js";