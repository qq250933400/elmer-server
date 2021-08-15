import "reflect-metadata";
import { Express, Request, Response } from "express";
import { getLogger } from "../logs";
import { Logger } from "log4js";
import GlobalStore,{ DECORATOR_MODEL_TYPE, DECORATOR_KEY } from "./GlobalStore";
import DefineDecorator from "./DefineDecorator";
import { pluginExec, pluginDestory } from "../plugin/PluginExec";
import { TypeRequestProvider } from "../plugin/ABasePlugin";
import utils from './utils';

type TypeRequestMethodOptions = {
    controller: any;
    attribute: string;
    returnValue?: any;
};

export const ROUTER_FLAG_SSID = "ROUTER_FLAG_SSID_9728e438-d856-41ca-b3d3-11812048";
export const ROUTER_KEY = "9728e438-d856-41ca-b3d3-11812048";
export const CONTROLLER_INTERCEPTOR = "CONTROLLER_INTERCEPTOR_9728e438-d856-41ca-b3d3-11812048";

export type TypeHttpType = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";

export const Controller = (namespace: string) => {
    return (target: new(...args: any[]) => any) => {
        DefineDecorator(() => {
            Reflect.defineMetadata("router_namespace", namespace, target);
            Reflect.defineMetadata(ROUTER_KEY, ROUTER_FLAG_SSID, target);
            Reflect.defineMetadata(DECORATOR_MODEL_TYPE, "Controller", target);
            target.prototype.namespace = namespace;
            GlobalStore.add(target);
        }, target, "Controller");
    }
}

const getRequestParams = (target: any,name: string, req: Request, res: Response) => {
    const key = "PARAM_DECORATOR_" + DECORATOR_KEY;
    const callbacks = target[key] ? target[key][name] : null;
    if(callbacks) {
        const args = [];
        callbacks.map((item) => {
            const index = item.index;
            const callback = item.callback;
            args[index] = callback(req, res);
        });
        return args;
    }
}
const BeforeRequestHandle = (req: Request, res: Response, next: Function, options: TypeRequestMethodOptions): boolean => {
    const interaptor = Reflect.getMetadata(CONTROLLER_INTERCEPTOR, options.controller);
    if(typeof interaptor === "function") {
        const params = getRequestParams(options.controller,options.attribute, req, res) || [];
        const returnValue = interaptor.apply(options.controller, params);
        if(!returnValue) {
            return true;
        } else {
            options.returnValue = returnValue;
            return false;
        }
    } else {
        return true;
    }
};
const AfterRequestHandle = (req: Request, res: Response, next: Function, options: TypeRequestMethodOptions) => {
    pluginDestory("Request");
};
const ExceptionHandle = (req: Request, res: Response, exception:Error) => {
    return pluginExec(["Request"], "RequestPlugin", "exception", exception, req, res);
};
export const RequestMapping = (path: string, type?: TypeHttpType, async?: boolean) => {
    return (target: any, attr: string, descriptor: PropertyDescriptor) => {
        const subscribe = ((handler:Function, routePath: string, method: TypeHttpType, isAsync: boolean, attr: string) => {
            return function(app:Express){
                const owner = this;
                const mType = method || "GET";
                const mPath = ("/" + this.namespace + "/" + routePath).replace(/\/\//g, "/");
                const logger:Logger = getLogger();
                const mTypeCallback = async function(req: Request, res: Response, next: Function) {
                    logger.info(`[${mType}] ` + req.url);
                    try{
                        const beforeOptions: TypeRequestMethodOptions = {
                            controller: target,
                            attribute: attr
                        };
                        if(BeforeRequestHandle(req, res, next, beforeOptions)) {
                            const paramer: any[] = getRequestParams(target,attr, req, res) || [];
                            const respResult = handler.apply(owner, paramer);
                            if(utils.isPromise(respResult)) {
                                respResult.then((respData) => {
                                    const respResultData = pluginExec<TypeRequestProvider>(["Request"], "RequestPlugin", "beforSend", respData);
                                    res.send(respResultData || respData);
                                })
                                .catch((err) => {
                                    const respResultData = pluginExec<TypeRequestProvider>(["Request"], "RequestPlugin", "beforSend", err);
                                    res.status(500);
                                    res.send(respResultData || err);
                                });
                            } else {
                                const respResultData = pluginExec<TypeRequestProvider>(["Request"], "RequestPlugin", "beforSend", respResult);
                                res.send(respResultData || respResult);
                            }
                        } else {
                            if(beforeOptions.returnValue?.statusCode && !/^200$/.test(beforeOptions.returnValue?.statusCode)) {
                                res.status(500);
                            }
                            res.send(beforeOptions.returnValue);
                        }
                    } catch(e) {
                        const exceptionResult: any = ExceptionHandle(req, res, e);
                        logger.error(e.stack);
                        if(exceptionResult) {
                            res.status(exceptionResult.status || 500).send(exceptionResult.responseBody || exceptionResult);
                        } else {
                            res.status(500).send({
                                statusCode: 500,
                                message: "Technical Error"
                            });
                        }
                    } finally {
                        AfterRequestHandle(req, res, next, {
                            controller: target,
                            attribute: attr
                        });
                    }
                };
                logger.info(`[INIT_${mType}] `+ mPath);
                this["app"] = app;
                switch (mType) {
                    case "GET":
                        app.get(mPath, mTypeCallback);
                        break;
                    case "POST":
                        app.post(mPath, mTypeCallback);
                        break;
                    case "PUT":
                        app.put(mPath, mTypeCallback);
                        break;
                    case "DELETE":
                        app.delete(mPath, mTypeCallback);
                        break;
                    case "OPTIONS":
                        app.options(mPath, mTypeCallback);
                        break;
                    default:
                        app.get(mPath, mTypeCallback);
                }
            };
        })(descriptor.value, path, type, async, attr);
        // subscribe.call(target);
        Object.defineProperty(target, ROUTER_KEY + "_" + attr, {
            enumerable: true,
            configurable: true,
            get: function() {
                return subscribe.bind(this);
            },
            set: () => {
                throw new Error("不允许重写路由方法。");
            }
        });
    };
};

export const AddInterceptors = (Target: any, attr: string, descriptor: PropertyDescriptor): void => {
    const inerceptor = Reflect.getMetadata(CONTROLLER_INTERCEPTOR, Target);
    if(!inerceptor) {
        Reflect.defineMetadata(CONTROLLER_INTERCEPTOR, descriptor.value, Target);
    }
}