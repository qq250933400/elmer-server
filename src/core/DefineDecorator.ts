import "reflect-metadata";
import { GetLogger } from "../logs";
import { DECORATOR_KEY } from "./GlobalStore";

type TypeDecoratorType = "Class" | "Property" | "Method" | "Controller";

/**
 * 定义参数装饰器
 * @param target 
 * @param methodName 
 * @param paramIndex 
 * @param fn 
 */
export const DefineParamDecorator = (target: any, methodName: string, paramIndex: number, fn:Function) => {
    const logger = GetLogger(target);
    try {
        const key = "PARAM_DECORATOR_" + DECORATOR_KEY;
        const paramDecorators = Reflect.getMetadata(key, target) || {};
        const callback = fn();
        if(!paramDecorators[methodName]) {
            paramDecorators[methodName] = [];
        }
        paramDecorators[methodName].push({
            index: paramIndex,
            callback
        });
        Reflect.defineMetadata(key, paramDecorators, target);
    } catch(e) {
        logger.error(e.stack);
    }
};

export const GetMethodParams = (target: any, methodName: string, ...args:any[]) => {
    const key = "PARAM_DECORATOR_" + DECORATOR_KEY;
    const paramDecorators = Reflect.getMetadata(key, target) || {};
    const allParams = Reflect.getMetadata("design:paramtypes", target, methodName) || [];
    const decParams = paramDecorators[methodName] || [];
    decParams.forEach((param) => {
        allParams[param.index] = param.callback(...args);
    });
    return allParams || [];
}

export default (fn:Function, factory: new(...args: any[]) => any, type: TypeDecoratorType = "Class") => {
    const logger = typeof GetLogger === "function" ? GetLogger (factory) : {error: (v) =>console.log(v)};
    try {
        Reflect.defineMetadata("DecoratorType", type || "Class", factory);
        fn();
    } catch(e) {
        logger.error(e.stack);
    }
}