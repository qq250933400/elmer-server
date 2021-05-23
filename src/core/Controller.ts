import "reflect-metadata";
import { Express,Request, Response } from "express";
import { logger } from "../logs";
import { ARouter } from "./ARouter";
import GlobalStore,{ DECORATOR_MODEL_TYPE } from "./GlobalStore";
import DefineDecorator from "./DefineDecorator";

export const ROUTER_FLAG_SSID = "ROUTER_FLAG_SSID_9728e438-d856-41ca-b3d3-11812048";
export const ROUTER_KEY = "9728e438-d856-41ca-b3d3-11812048";

export type TypeHttpType = "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS";

export const Controller = (namespace: string) => {
    return (target: new(...args: any[]) => any) => {
        DefineDecorator(() => {
            Reflect.defineMetadata(ROUTER_KEY + "_namespace", namespace, target);
            Reflect.defineMetadata(ROUTER_KEY, ROUTER_FLAG_SSID, target);
            Reflect.defineMetadata(DECORATOR_MODEL_TYPE, "Controller", target);
            target.prototype.namespace = namespace;
            GlobalStore.add(target);
        }, target, "Controller");
    }
}

export const RequestMapping = (path: string, type?: TypeHttpType, async?: boolean) => {
    return (target: any, attr: string, descriptor: PropertyDescriptor) => {
        const subscribe = ((handler:Function, routePath: string, method: TypeHttpType, isAsync: boolean) => {
            return function(app:Express){
                const owner = this;
                const mType = method || "GET";
                const mPath = ("/" + this.namespace + "/" + routePath).replace(/\/\//g, "/");
                const mTypeCallback = async function(req: Request, res: Response) {
                    logger.info(`[${mType}] ` + req.url);
                    if(isAsync) {
                        const respData = await handler.call(owner, req, res);
                        res.send(respData);
                    } else {
                        res.send(handler.call(owner, req, res));
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
        })(descriptor.value, path, type, async);
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
