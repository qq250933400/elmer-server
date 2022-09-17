import "reflect-metadata";
import { CONST_DECORATOR_FOR_MODULE_METHOD } from "../data/const";

interface ICreateFuncParamDecOpt {
    target: any;
    func: string;
    paramIndex: number;
}
/**
 * 定义参数装饰器
 * @param target 
 * @param methodName 
 * @param paramIndex 
 * @param fn 
 */
export const createParamDecorator = (opt: ICreateFuncParamDecOpt, fn:Function) => {
    const { target, func, paramIndex } = opt;
    const paramDecorators = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_METHOD, target) || {};
    const callback = fn();
    if(!paramDecorators[func]) {
        paramDecorators[func] = [];
    }
    paramDecorators[func].push({
        index: paramIndex,
        callback
    });
    Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_METHOD, paramDecorators, target);
};

export const getParamsFromMethodDecorator = (target: any, methodName: string, ...args:any[]) => {
    const paramDecorators = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_METHOD, target) || {};
    const allParams = Reflect.getMetadata("design:paramtypes", target, methodName) || [];
    const decParams = paramDecorators[methodName] || [];
    decParams.forEach((param) => {
        allParams[param.index] = param.callback(...args);
    });
    return allParams || [];
}
