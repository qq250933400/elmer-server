import { AppService } from "../core/Module";
import { Logger, GetLogger } from "./LogInit";

@AppService
export class Log {
    @GetLogger
    private logObj: Logger;
    
    public info(message: string, ...args: any[]) {
        this.logObj.info(message, ...args);
    }
    public debug(message: string, ...args: any[]) {
        this.logObj.debug(message, ...args);
    }
    public error(message: string, ...args: any[]) {
        this.logObj.error(message, ...args);
    }
    public warn(message: string, ...args: any[]) {
        this.logObj.warn(message, ...args);
    }
    public trace(message: string, ...args: any[]) {
        this.logObj.trace(message, ...args);
    }
    public mark(message: string, ...args: any[]) {
        this.logObj.mark(message, ...args);
    }
}