import "reflect-metadata";
import { Express, Request, Response } from "express";
import { getLogger } from "../logs";
import { Logger } from "log4js";
import GlobalStore,{ DECORATOR_MODEL_TYPE, DECORATOR_KEY } from "./GlobalStore";
import DefineDecorator from "./DefineDecorator";
import { pluginExec, pluginDestory } from "../plugin/PluginExec";
import { TypeRequestProvider } from "../plugin/ABasePlugin";

export const ROUTER_FLAG_SSID = "ROUTER_FLAG_SSID_9728e438-d856-41ca-b3d3-11812048";
export const ROUTER_KEY = "9728e438-d856-41ca-b3d3-11812048";

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
const BeforeRequestHandle = (req: Request, res: Response, next: Function) => {
    
};
const AfterRequestHandle = (req: Request, res: Response, next: Function) => {
    pluginDestory("Request");
}
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
                        BeforeRequestHandle(req, res, next)
                        const paramer: any[] = getRequestParams(target,attr, req, res) || [];
                        if(isAsync) {
                            const respData = await handler.apply(owner, paramer);
                            const respResult = pluginExec<TypeRequestProvider>(["Request"], "RequestPlugin", "beforSend", respData);
                            if(respResult) {
                                res.send(respResult);
                            } else {
                                res.send(respData);
                            }
                        } else {
                            const respData = handler.apply(owner, paramer);
                            const respResult = pluginExec<TypeRequestProvider>(["Request"], "RequestPlugin", "beforSend", respData);
                            if(respResult) {
                                res.send(respResult);
                            } else {
                                res.send(respData);
                            }
                        }
                    } catch(e) {
                        logger.error(e.stack);
                        res.status(500).send({
                            statusCode: 500,
                            message: "Technical Error"
                        });
                    } finally {
                        AfterRequestHandle(req, res, next);
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
}
