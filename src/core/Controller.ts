import "reflect-metadata";
import { Express, Request, Response } from "express";
import { DECORATORS_CLASS_TYPE, DECORATORS_MODEL_ID } from "elmer-common/lib/decorators/base";
import utils from './utils';
import { getLogger } from "../logs";
import { Logger } from "log4js";
import GlobalStore,{ DECORATOR_MODEL_TYPE, DECORATOR_KEY } from "./GlobalStore";
import DefineDecorator, { GetMethodParams } from "./DefineDecorator";
import { pluginExec, pluginDestory } from "../plugin/PluginExec";
import { TypeRequestProvider } from "../plugin/ABasePlugin";
import { queueCallFunc } from "elmer-common";


type TypeRequestMethodOptions = {
    controller: any;
    attribute: string;
    returnValue?: any;
};

const CONTROLLER_ROUTER_NAMESPACE = "router_namespace";
export const ROUTER_FLAG_SSID = "ROUTER_FLAG_SSID_9728e438-d856-41ca-b3d3-11812048";
export const ROUTER_KEY = "9728e438-d856-41ca-b3d3-11812048";
export const CONTROLLER_INTERCEPTOR = "CONTROLLER_INTERCEPTOR_9728e438-d856-41ca-b3d3-11812048";


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

const beforeResponseHandler = (opt: TypeRequestMethodOptions, req: Request, res: Response, next: Function):any => {
    // 先执行interceptors hook
    const saveInerceptors = Reflect.getMetadata(CONTROLLER_INTERCEPTOR, opt.controller) || [];
    if(saveInerceptors) {
        return new Promise((_resolve, _reject) => {
            queueCallFunc(saveInerceptors, (optx, vparam: any):any => {
                return new Promise((resolve, reject) => {
                    // inecreptor只要有一个返回结果，即表示要返回拦截的结果，不在往下执行.
                    if(!optx.lastResult) {
                        // 上一次拦截没有返回即表示需要往下执行拦截方法
                        const vApplyParams = GetMethodParams(opt.controller, vparam.attrKey, req, res);
                        const checkResult = vparam.callback.apply(opt.controller, vApplyParams);
                        if(utils.isPromise(checkResult)) {
                            checkResult.then((vData) => {
                                resolve(vData);
                            }).catch((err) => {
                                reject(err);
                            });
                        } else {
                            resolve(checkResult);
                        }
                    } else {
                        // 将上一次结果当做最终结果处理
                        resolve(optx.lastResult);
                    }
                });
            }, {
                throwException: true,
                paramConvert: (param: any) => {
                    if(param.id !== "pluginResult") {
                        return {
                            id: param.attrKey,
                            params: param
                        };
                    } else {
                        return param;
                    }
                },
                onBefore: (paramList: any[]) => {
                    paramList.push({
                        id: "pluginResult",
                        params: {},
                        fn: (myOpt:any) => {
                            if(!myOpt.lastResult) {
                                return pluginExec(["Request"], "RequestPlugin", "beforeRequest", req, res, next);
                            } else {
                                return myOpt.lastResult;
                            }
                        }
                    })
                }
            }).then((data) => {
                _resolve(data.pluginResult);
            }).catch((err) => {
                _reject(err.exception);
            });
        });
    }
    // need to call plugin to do the handler before request
};
const afterResponseHandler = (opt: TypeRequestMethodOptions, req: Request, res: Response, next: Function):any => {

};

const exceptionHandler = (opt: TypeRequestMethodOptions & { exception: Error }, req: Request, res: Response, next: Function):any => {

};
const setRouteListen = (app:Express,constroller: any, route: TypeDefineRoute) => {
    const logger:Logger = getLogger();
    const requestListener = ((obj: any, config: TypeDefineRoute) => {
        return function(req: Request, res: Response, next: Function) {
            const methodMaxLen = 7;
            const spaceLen = methodMaxLen > config.method.length ? (" ".repeat(methodMaxLen - config.method.length)) : "";
            logger.info(`[${config.method}]${spaceLen} ${req.url}`);
            queueCallFunc([
                {
                    id: "before",
                    params: {},
                    fn: () => beforeResponseHandler({
                        controller: obj,
                        attribute: config.attrKey
                    }, req, res, next)
                },
                {
                    id: "handler",
                    params: {},
                    fn: (opt) => {
                        if(!opt.lastResult) {
                            const params: any[] = GetMethodParams(obj, config.attrKey, req, res, next) || [];
                            return obj[config.attrKey].apply(obj, params);
                        } else {
                            return opt.lastResult;
                        }
                    }
                }, {
                    id: "after",
                    params: {},
                    fn: () => afterResponseHandler({
                        controller: obj,
                        attribute: config.attrKey
                    }, req, res, next)
                }
            ], null, {
                throwException: true
            }).then((resp: any) => {
                res.send(resp.handler);
            }).catch((err) => {
                logger.error(err);
                // 错误统一处理
                const exceptionResult = exceptionHandler({
                    controller: obj,
                    attribute: route.attrKey,
                    returnValue: null,
                    exception: err
                }, req, res, next);
                res.status(500);
                if(!exceptionResult) {
                    res.send({
                        statusCode: 500,
                        message: "系统内部程序错误。"
                    });
                } else {
                    res.send(exceptionResult);
                }
            });
        };
    })(constroller, route);
    const methodMaxLen = 7;
    const spaceLen = methodMaxLen > route.method.length ? (" ".repeat(methodMaxLen-route.method.length)) : "";
    switch(route.method) {
        case "GET":
            app.get(route.url, requestListener);
            break;
        case "POST":
            app.post(route.url, requestListener);
            break;
        case "DELETE":
            app.delete(route.url, requestListener);
            break;
        case "OPTIONS":
            app.options(route.url, requestListener);
            break;
        case "PUT":
            app.put(route.url, requestListener);
            break;
        default:
            app.get(route.url, requestListener);
    }

    logger.info(`[Init][${route.method}]${spaceLen}  `, route.url);
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
                                setRouteListen(app, cObj, {
                                    ...defineRoute,
                                    url: routeUrl
                                });
                            })(route, obj);
                        });
                    }
                    controllerStorage.objPool[moduleId] = obj;
                }
            })(Controller);
        }
    });
};

export const AddInterceptors = (Target: any, attr: string, descriptor: PropertyDescriptor): void => {
    const saveInerceptors = Reflect.getMetadata(CONTROLLER_INTERCEPTOR, Target) || [];
    saveInerceptors.push({
        attrKey: attr,
        callback: descriptor.value,
        target: Target
    });
    Reflect.defineMetadata(CONTROLLER_INTERCEPTOR, saveInerceptors, Target);
    Object.defineProperty(Target, attr, {
        value: descriptor.value,
        configurable: true,
        enumerable: false,
        writable: false
    });
};