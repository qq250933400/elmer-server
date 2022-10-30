import { queueCallFunc } from "elmer-common";
import "reflect-metadata";
import {
    CONST_DECORATOR_FOR_MODULE_METHOD,
    CONST_DECORATOR_FOR_FUNC_HOOK
} from "../data/const";

interface ICreateFuncParamDecOpt {
    target: any;
    func: string;
    paramIndex: number;
}

interface IOnHook {
    onBeforeRouteInit: (app: any) => void;
    onAfterRouteInit: (app: any) => void;
    onBeforeStaticInit: (app: any) => void;
}
interface IHookInfo {
    name: string;
    callback: Function;
    handler: any;
}

/**
 * 定义参数装饰器
 * @param opt - 必要参数
 * @param fn - 自定义处理
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

export const onHook = (lifeKey: keyof IOnHook, fn?: Function) => {
    return (target: any, attrKey: string, descriptor: PropertyDescriptor) => {
        const defineHooks = Reflect.getMetadata(CONST_DECORATOR_FOR_FUNC_HOOK, target) || {};
        if(!defineHooks[lifeKey]) {
            defineHooks[lifeKey] = [];
        }
        typeof fn === "function" && fn(target, attrKey, descriptor);
        defineHooks[lifeKey].push({
            name: attrKey,
            callback: descriptor.value,
            handler: target
        });
        Reflect.defineMetadata(CONST_DECORATOR_FOR_FUNC_HOOK, defineHooks, target);
    }
};

export const callHook = (target: any, lifeKey: keyof IOnHook, ...args: any[]) => {
    const defineHooks = Reflect.getMetadata(CONST_DECORATOR_FOR_FUNC_HOOK, target) || {};
    const lifeHook: IHookInfo[] = defineHooks[lifeKey] || [];
    let index = -1;
    return queueCallFunc(lifeHook as any[], (_, param: IHookInfo) => {
        return param.callback.apply(param.handler, [...args]);
    }, {
        throwException: true,
        paramConvert: (param) => {
            index += 1;
            return {
                id: "func_" + index,
                params: param
            };
        }
    });
}