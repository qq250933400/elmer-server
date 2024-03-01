import "reflect-metadata";
import { AppService } from "../core/Module";
import { Express, Request, Response } from "express";
import { getControllers, TypeDefineRoute, TypeRequestMethod } from "./decorators";
import {
    CONST_DECORATOR_CONTROLLER_ROUTER,
    CONST_DECORATOR_CONTROLLER_NAMESPACE,
    CONST_DECORATOR_CONTROLLER_REQUESTID,
    CONST_DECORATOR_CONTROLLER_EXCEPTION
} from "../data";
import { getParamsFromMethodDecorator } from "../core/Decorators";
import { getObjFromInstance } from "../core/Module";
import { utils, queueCallFunc } from "elmer-common";
import { GetLogger, Logger } from "../logs";
import { SessionService } from "../session";
import { callHook, callInterceptor } from "../core/Decorators";
import com from "../utils/utils";

type TypeFactory = new(...args:any) => any;
type TypeRouteHandler = (request: Request, response: Response, next: Function) => any;

@AppService
export class RouterController {
    @GetLogger
    private logger: Logger;

    private objPool: any = {};
    constructor(
        private session: SessionService
    ) {

    }
    routeListen(app: Express, configApplication: any): void {
        const controllers: TypeFactory[] = getControllers();
        this.logger.info('Initialize route: ');
        callHook(configApplication, "onBeforeRouteInit", app);
        app.use("*", (req, res, next) => {
            callInterceptor(configApplication, req, res).then(() => {
                next();
            }).catch((err) => {
                next(err);
            });
        });
        controllers.forEach((Controller:TypeFactory) => {
            this.ctrlListen(Controller, app);
        });
        callHook(configApplication, "onAfterRouteInit", app);
    }
    /**
     * 创建路由监听事件
     * @param Controller 
     * @param app 
     */
    private ctrlListen(Controller: TypeFactory, app: Express): void {
        const namespace = Reflect.getMetadata(CONST_DECORATOR_CONTROLLER_NAMESPACE, Controller);
        const routers = Reflect.getMetadata(CONST_DECORATOR_CONTROLLER_ROUTER, Controller);
        if(utils.isArray(routers) && routers.length > 0) {
            routers.forEach((route: TypeDefineRoute) => {
                ((name: string, routeData: TypeDefineRoute, ControllerFactory: TypeFactory) => {
                    const pathName = ((name || "") + "/" + routeData.url).replace(/[\/]{2,}/, "/");
                    const url = utils.isRegExp(routeData.url) ? routeData.url : pathName.startsWith("/") ? pathName : "/" + pathName;
                    const method: TypeRequestMethod = routeData.method || "GET";
                    const listenCallback = this.createRouteHandler(ControllerFactory, routeData);
                    switch(method) {
                        case "GET": {
                            app.get(url, listenCallback);
                            break;
                        }
                        case "POST": {
                            app.post(url, listenCallback);
                            break;
                        }
                        case "PUT": {
                            app.put(url, listenCallback);
                            break;
                        }
                        case "DELETE": {
                            app.delete(url, listenCallback);
                            break;
                        }
                        case "OPTIONS": {
                            app.options(url, listenCallback);
                            break;
                        }
                    }
                    const spec = " ".repeat(9 - method.length);
                    if(utils.isRegExp(url)) {
                        this.logger.info(`  [${method}]${spec}${url} [RegExp]`);
                    } else {
                        this.logger.info(`  [${method}]${spec}${url}`);
                    }
                })(namespace, route, Controller);
            });
        }
    }
    /**
     * 路由监听回调，控制器路由调用后的处理
     * @param Controller 
     * @param route 
     * @returns 
     */
    private createRouteHandler(Controller: TypeFactory, route: TypeDefineRoute): TypeRouteHandler {
        return (req: Request, res: Response, next: Function) => {
            const controller = this.createController(Controller);
            try {
                const url = req.url;
                const method = req.method;
                const ctrlParams = getParamsFromMethodDecorator(controller, route.callbackName, req, res, next);
                this.logger.info(`[${method}] ${url}`);
                this.session.registe(req, controller.uid);
                com.invoke(() => {
                    return controller[route.callbackName].apply(controller, ctrlParams);
                }).then((resData) => {
                    res.send(resData);
                    this.releaseController(controller);
                }).catch((err) => {
                    this.exceptionHandle(req, res, next, err, controller, route);
                    this.releaseController(controller);
                });
            } catch(e) {
                this.exceptionHandle(req, res, next, e, controller, route);
                this.releaseController(controller);
            }
        };
    }
    private releaseController(ctrl: any): void {
        const uid = ctrl.uid;
        const reqObjs = this.objPool[uid] || {};
        Object.keys(reqObjs).forEach((objId: string) => {
            const obj = reqObjs[objId];
            typeof obj.destory === "function" && obj.destory();
            delete reqObjs[objId];
        });
        this.session.unRegiste(uid);
        delete this.objPool[uid];
    }
    private exceptionHandle(req: Request, res: Response, next: Function, err: Error, controller: any, route: TypeDefineRoute): void {
        const handlers = Reflect.getMetadata(CONST_DECORATOR_CONTROLLER_EXCEPTION, controller);
        this.logger.error(`(500) ${err.message}`);
        console.error(err);
        if(handlers && handlers.length > 0) {
            for(const handler of handlers) {
                const ctrlParams = getParamsFromMethodDecorator(controller, handler.callbackName, req, res, next);
                const excpetionData = handler.callback.apply(controller, ctrlParams);
                if(excpetionData) {
                    res.send(excpetionData);
                    return;
                }
            }
        }
        res.status(500);
        res.send(err || {
            statusCode: "500",
            message: "应用程序内部错误，请联系管理员。",
            error: err
        });
    }
    private createController(Controller: TypeFactory): any {
        const reqId = "ser_req_" + utils.guid();
        const reqObj = getObjFromInstance(Controller, this, (Factory: new(...args:any[]) => any, opt) => {
            const reqPool = this.objPool[reqId] || {};
            let obj = reqPool[opt.uid];
            opt.shouldInit = true;
            if(!this.objPool[reqId]) {
                this.objPool[reqId] = reqPool;
            }
            if(!obj) {
                Reflect.defineMetadata(CONST_DECORATOR_CONTROLLER_REQUESTID, reqId, Factory);
                obj = new Factory(...opt.args);
                reqPool[opt.uid] = obj;
            }
            return obj;
        });
        reqObj.uid = reqId;
        return reqObj;
    }
}
