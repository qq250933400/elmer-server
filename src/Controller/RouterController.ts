import "reflect-metadata";
import { AppService } from "../core/Module";
import { Express, Request, Response } from "express";
import { getControllers, TypeDefineRoute, TypeRequestMethod } from "./decorators";
import {
    CONST_DECORATOR_CONTROLLER_ROUTER,
    CONST_DECORATOR_CONTROLLER_NAMESPACE
} from "../data";
import { getParamsFromMethodDecorator } from "../core/Decorators";
import { getObjFromInstance } from "../core/Module";
import { utils } from "elmer-common";
import { GetLogger, Logger } from "../logs";

type TypeFactory = new(...args:any) => any;
type TypeRouteHandler = (request: Request, response: Response, next: Function) => any;

@AppService
export class RouterController {
    @GetLogger
    private logger: Logger;

    private objPool: any = {};

    routeListen(app: Express): void {
        const controllers: TypeFactory[] = getControllers();
        this.logger.info('Initialize route: ');
        controllers.forEach((Controller:TypeFactory) => {
            this.ctrlListen(Controller, app);
        });
    }
    private ctrlListen(Controller: TypeFactory, app: Express): void {
        const namespace = Reflect.getMetadata(CONST_DECORATOR_CONTROLLER_NAMESPACE, Controller);
        const routers = Reflect.getMetadata(CONST_DECORATOR_CONTROLLER_ROUTER, Controller);
        if(utils.isArray(routers) && routers.length > 0) {
            routers.forEach((route: TypeDefineRoute) => {
                ((name: string, routeData: TypeDefineRoute, ControllerFactory: TypeFactory) => {
                    const pathName = ((name || "") + "/" + routeData.url).replace(/[\/]{2,}/, "/");
                    const url = pathName.startsWith("/") ? pathName : "/" + pathName;
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
                    this.logger.info(`  [${method}]${spec}${url}`);
                })(namespace, route, Controller);
            });
        }
    }
    private createRouteHandler(Controller: TypeFactory, route: TypeDefineRoute): TypeRouteHandler {
        return (req: Request, res: Response, next: Function) => {
            try {
                const controller = this.createController(Controller);
                const url = req.url;
                const method = req.method;
                const ctrlParams = getParamsFromMethodDecorator(controller, route.callbackName, req, res, next);
                this.logger.info(`[${method}] ${url}`);
                const resData = controller[route.callbackName].apply(controller, ctrlParams);
                res.status(200);
                res.send(resData);
            } catch(e) {
                this.exceptionHandle(req, res, next, e);
            }
        };
    }
    private exceptionHandle(req: Request, res: Response, next: Function, err: Error): void {
        this.logger.error(`(T500) ${err.message}`);
        this.logger.error(err.stack);
        res.status(500);
        res.send({
            statusCode: "T500",
            message: "Something went wrong in application."
        });
    }
    private createController(Controller: TypeFactory): any {
        const reqId = "ser_req_" + utils.guid();
        
        const reqObj = getObjFromInstance(Controller, this, (Factory: new(...args:any[]) => any, opt) => {
            const reqPool = this.objPool[reqId] || {};
            let obj = reqPool[opt.uid];
            if(!this.objPool[reqId]) {
                this.objPool[reqId] = reqPool;
            }
            if(!obj) {
                obj = new Factory(...opt.args);
                reqPool[opt.uid] = obj;
            }
            return obj;
        });
        return reqObj;
    }
}
