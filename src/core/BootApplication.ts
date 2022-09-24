import "reflect-metadata";
import {
    CONST_DECORATOR_FOR_MODULE_BOOTAPPLICATION,
    CONST_BOOTAPPLICATION_MODULE_FLAG
} from "../data";
import { AppService } from "./Module";
import { invokeApplication } from "./Application";

export const BootApplication = (Target: new(...args:any) => any): void => {
    AppService(Target);
    Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_BOOTAPPLICATION, CONST_BOOTAPPLICATION_MODULE_FLAG, Target);   
}

export const startApplication = <T={}>(App: new(...args:any) => any ): T => {
    const bootApplicationFlag = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_BOOTAPPLICATION, App);
    if(bootApplicationFlag !== CONST_BOOTAPPLICATION_MODULE_FLAG) {
        throw new Error("Application模块需要使用BootApplication装饰器装载。");
    } else {
        return invokeApplication(App) as any;
    }
}