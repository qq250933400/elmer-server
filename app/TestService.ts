import { utils } from "elmer-common";
import { DECORATORS_CLASS_TYPE, DECORATORS_MODEL_ID } from "elmer-common/lib/decorators/base";
import { Express } from "express";
import "reflect-metadata";

type TypeRequestType = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";
type TypeDefineRoute = {
    attrKey: string;
    uid: string;
    url: string|RegExp;
    method: TypeRequestType;
    target?: any;
};

const CONST_DECORATORS_EXPRESS_CONTROLLER = "CONST_DECORATORS_EXPRESS_CONTROLLER"; // controller标识
const CONST_DECORATORS_EXPRESS_CONTROLLER_NAMESPACE = "CONST_DECORATORS_EXPRESS_CONTROLLER_NAMESPACE"; // 定义controller namespace属性
const CONST_DECORATORS_EXPRESS_CONTROLLER_ROUTE = "CONST_DECORATORS_EXPRESS_CONTROLLER_ROUTE"; // Route标识

const controllerStorage = {
    classPool: [],
    objPool: {},
    routers: []
};

export const Controller = (namespace: string) => {
    return (Target: new(...args: any[]) => any) => {
        const classType = Reflect.getMetadata(DECORATORS_CLASS_TYPE, Target);
        if(utils.isEmpty(classType)) {
            if(!utils.isEmpty(namespace)) {
                const uid = "elmer_boot_controller_" + utils.guid();
                Reflect.defineMetadata(CONST_DECORATORS_EXPRESS_CONTROLLER_NAMESPACE, namespace, Target);
                Reflect.defineMetadata(DECORATORS_CLASS_TYPE, CONST_DECORATORS_EXPRESS_CONTROLLER, Target);
                Reflect.defineMetadata(DECORATORS_MODEL_ID, "elmer_boot_controller_" + utils.guid(), Target);
                controllerStorage.classPool.push(Target);
            }
        } else {
            throw new Error("Controller不允许被注释为其他类型的类");
        }
    }
};

export const RequestMapping = (path: string|RegExp, type?: TypeRequestType) => {
    return (target: any, attr: any, descriptor: PropertyDescriptor) => {
        // const currentRoutes: TypeDefineRoute[] = controllerStorage.routers || [];
        const routeId = CONST_DECORATORS_EXPRESS_CONTROLLER_ROUTE + "_" + attr;
        const defineRoutes: any[] = Reflect.getMetadata(CONST_DECORATORS_EXPRESS_CONTROLLER_ROUTE, target) || [];
        if(utils.isEmpty(path)) {
            throw new Error("定义路由地址不能为空")
        }
        const filterRoutes = defineRoutes.filter((value) => value.url === path);
        if(!filterRoutes || filterRoutes.length <= 0) {
            console.log(filterRoutes, attr);
            defineRoutes.push({
                uid: routeId,
                attrKey: attr,
                url: path,
                method: type
            });
            Object.defineProperty(target, attr, {
                configurable: true,
                enumerable: false,
                get: () => descriptor.value.bind(target),
                set: () => {
                    throw new Error("定义路由不允许被重写。");
                }
            });
            Reflect.defineMetadata(CONST_DECORATORS_EXPRESS_CONTROLLER_ROUTE, defineRoutes, target);
        } else {
            throw new Error("定义路由地址重复。" + path);
        }
    };
};

export const initRoute = (app:Express) => {
    const allControlelrs = controllerStorage.classPool || [];
    allControlelrs.forEach((Controller: new(...args: any[]) => any) => {
        const classType = Reflect.getMetadata(DECORATORS_CLASS_TYPE, Controller);
        if(classType !== CONST_DECORATORS_EXPRESS_CONTROLLER) {
            throw new Error("错误的控制器，必须使用Controller装饰器声明。");
        } else {
            ((DefineController: new(...args: any[]) => any) => {
                const moduleId = Reflect.getMetadata(DECORATORS_MODEL_ID, DefineController);
                if(!controllerStorage.objPool[moduleId]) {
                    const obj = new Controller();
                    const namespace = Reflect.getMetadata(CONST_DECORATORS_EXPRESS_CONTROLLER_NAMESPACE, DefineController);
                    const routers = Reflect.getMetadata(CONST_DECORATORS_EXPRESS_CONTROLLER_ROUTE, obj);
                    if(routers && routers.length > 0) {
                        routers.forEach((route: TypeDefineRoute) => {
                            ((defineRoute: TypeDefineRoute, cObj: any) => {
                                const url = [namespace, defineRoute.url].join("/").replace(/\/\//g, "/");
                                const routeUrl = /^\//.test(url) ? url : "/" + url;
                                console.log(routeUrl);
                            })(route, obj);
                        });
                    }
                    controllerStorage.objPool[moduleId] = obj;
                }
            })(Controller);
        }
    });
}