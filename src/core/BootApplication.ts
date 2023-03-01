import "reflect-metadata";
import {
    CONST_DECORATOR_FOR_MODULE_BOOTAPPLICATION,
    CONST_BOOTAPPLICATION_MODULE_FLAG,
    CONST_DECORATOR_FOR_FUNC_HOOK_INIT
} from "../data";
import { AppService, delegateInit } from "./Module";
import { invokeApplication } from "./Application";
import { onHook } from "./Decorators";

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

const applicationHook = (target: any) => {
    const initFlag = Reflect.getMetadata(CONST_DECORATOR_FOR_FUNC_HOOK_INIT, target);
    if(!initFlag) {
        delegateInit(() => {
            const flag = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_BOOTAPPLICATION, target.constructor);
            if(flag !== CONST_BOOTAPPLICATION_MODULE_FLAG) {
                throw new Error("onBeforeRouteInit只能在BootApplication类中使用");
            }
        })(target.constructor);
        Reflect.defineMetadata(CONST_DECORATOR_FOR_FUNC_HOOK_INIT, true, target);
    }
}

export const $afterRouteInit = () => onHook("onAfterRouteInit", applicationHook);
export const $beforeRouteInit = () => onHook("onBeforeRouteInit", applicationHook);
export const $beforeStaticInit = () => onHook("onBeforeStaticInit", applicationHook);
