import "reflect-metadata";
import { utils } from "elmer-common";
import {
    CONST_DECORATOR_CONTROLLER_ROUTER,
    CONST_DECORATOR_CONTROLLER_NAMESPACE,
    CONST_DECORATOR_FOR_MODULE_CLASSID
} from "../data";

export type TypeRequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
export type TypeDefineRoute = {
    /** 装载源方法名称 */
    callbackName: string;
    callback: Function;
    uid: string;
    url: string|RegExp;
    method: TypeRequestMethod;
    target?: any;
};

const controllers: any[] = [];

export const getControllers = () => controllers;

export const Controller = (namespace?: string) => {
    return (Target: new(...args: any[]) => any) => {
        const uid = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_CLASSID, Target);
        Reflect.defineMetadata(CONST_DECORATOR_CONTROLLER_NAMESPACE, namespace, Target);
        if(utils.isEmpty(uid)) {
            const newUID = "RequestController_" + utils.guid();
            Reflect.defineMetadata(CONST_DECORATOR_FOR_MODULE_CLASSID, newUID, Target);
        }
        if(controllers.indexOf(Target) < 0) {
            controllers.push(Target);
        } else {
            throw new Error(`禁止重复引用controller.${namespace}`);
        }
    };
};

export const RequestMapping = (pathName: string, method?: TypeRequestMethod) => {
    return (target: any, attrName: string, descriptor: PropertyDescriptor) => {
        const Factory = target.constructor;
        const routers: TypeDefineRoute[] = Reflect.getMetadata(CONST_DECORATOR_CONTROLLER_ROUTER, Factory) || [];
        const uid: string = "Route_" + utils.guid();
        routers.push({
            url: pathName,
            method: method || "GET",
            uid,
            callbackName: attrName,
            callback: descriptor.value
        });
        Reflect.defineMetadata(CONST_DECORATOR_CONTROLLER_ROUTER, routers, Factory);
    };
};