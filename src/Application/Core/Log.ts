import log4js from "log4js";
import { AppService  } from "../../Annotation/module";
import { GetConfig  } from "../../Config";
import { IConfigLog } from "../../Config/interface/IConfigLog";

@AppService
export class Log {
    @GetConfig("Log")
    private config: IConfigLog;

    private logger: log4js.Logger;
    private isLoadConfig: boolean;
    constructor() {
        this.logger = log4js.getLogger();
    }
    public debug(message: string, ...args: any[]) {
        this.loadConfig();
        this.logger.debug(message, ...args);
    }
    public info(message: string, ...args: any[]) {
        this.loadConfig();
        this.logger.info(message, ...args);
    }
    public warn(message: string, ...args: any[]) {
        this.loadConfig();
        this.logger.warn(message, ...args);
    }
    public error(message: string, ...args: any[]) {
        this.loadConfig();
        this.logger.error(message, ...args);
    }
    private loadConfig() {
        if(!this.isLoadConfig) {
            const categoryName = this.config.category || "cheese";
            const logPath = this.config.savePath || "./logs";
            log4js.configure({
                appenders: {
                    [categoryName]: {
                        type: this.config.type || "dateFile",
                        filename: `${logPath}/cheese.log`,
                        pattern: "yyyy-MM-dd-hh",
                        compress: false,
                    },
                    console: {
                        type: "console"
                    }
                },
                categories: { default: { appenders: [ "console", categoryName ], level: this.config.level || "error" } },
            });
            this.isLoadConfig = true;
        }
    }
}