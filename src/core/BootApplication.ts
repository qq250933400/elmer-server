import "reflect-metadata";
import * as express from "express";
import { Express,Request, Response } from "express";
import GlobalStore,{ DECORATOR_MODEL_TYPE } from "./GlobalStore";
import DefineDecorator from "./DefineDecorator";
import { ROUTER_KEY, ROUTER_FLAG_SSID } from "./Controller";
import { getApplicationConfig } from "../config";
import { getLogger } from "../logs";
import { json } from 'body-parser';
import { pluginExec } from "../plugin/PluginExec";
import { TypeRequestProvider } from "../plugin/ABasePlugin";
import * as Events from "events";

const crossSiteConfig = (app:Express) => {
    app.all('*', (req: Request, res: Response, next) => {
        const eventObj = {
            continue: true
        };
        pluginExec<TypeRequestProvider>(["Request"], "RequestPlugin", "beforeRequest", req, res, next, eventObj);
        eventObj.continue && next();
    })
};
/**
 * 初始化所有controller
 * @param app 
 */
const initRouter = (app:Express): void => {
    const controllers = GlobalStore.getControllers();
    if(controllers) {
        Object.keys(controllers).map((namespace) => {
            const Controller = controllers[namespace];
            const ssid = Reflect.getMetadata(ROUTER_KEY, Controller);
            if(ssid !== ROUTER_FLAG_SSID) {
                throw new Error(`路由Controller定义错误，必须使用Controller装饰器声明。(${namespace})`);
            } else {
                const obj = new Controller();
                const protoObj = obj["__proto__"];
                protoObj && Object.keys(protoObj).map((attr: string) => {
                    const prefixKey = attr.substr(0, ROUTER_KEY.length);
                    if(prefixKey === ROUTER_KEY) {
                        const attrFn = protoObj[attr];
                        if(typeof attrFn === "function") {
                            attrFn(app);
                        } else {
                            throw new Error("定义路由请求method不是Function函数。");
                        }
                    }
                });
            }
        });
    }
};

export const BootApplication = (Target: new(...args: any[]) => any) => {
    DefineDecorator(() => {
        if(typeof Target.prototype.main !== "function") {
            throw new Error("启动类必须实现main函数。");
        }
        const logger = getLogger();
        const mainCallback = Target.prototype.main;
        Reflect.defineMetadata(DECORATOR_MODEL_TYPE,"BootApplication", Target);
        GlobalStore.add(Target);
        Target.prototype.main = () => {
            const applicationConfig = getApplicationConfig();
            const host = applicationConfig?.Server?.host || "0.0.0.0";
            const port = applicationConfig?.Server?.port || 80;
            const app = express();
            Events.EventEmitter.defaultMaxListeners = 0;
            crossSiteConfig(app);
            // include middleware for express framework
            app.use(json());
            // end include middleware
            initRouter(app);
            mainCallback.call(Target.prototype, app);
            app.listen(applicationConfig?.Server?.port, host, ()=>{
                logger.info(`Server on: ${host}:${port}`);
            });
        };
    }, Target);
}

export type TypeBootApplication = {
    main():void;
};
