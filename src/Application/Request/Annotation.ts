import { Adapter } from "../Core/Adapter";
import { META_KEY_MODULE_ID, META_KEY_INSTANCE_ID } from "../../data/constants";
import { createInstance } from "../../Annotation/createInstance";
import { v7 as uuid } from "uuid";
import utils from "../../utils/utils";

export enum RequestMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
    HEAD = "HEAD",
    OPTIONS = "OPTIONS",
}

interface IDefineRequest {
    url: string;
    method: keyof typeof RequestMethod;
    callback: Function;
    callbackName: string;
}
export interface IDefineRoute extends IDefineRequest {
    baseName: string;
    Target: new(...args: any[]) => any;
}

export interface IDefineRequestParam {
    type: 'Body'|'PathParam'|'QueryParam',
    args?: any[]| string;
}

const requestDataStore = {
    tempRequest: [],
    requests: []
};

export const GetParam = (opt: IDefineRequestParam[]) => (value: Function, context: ClassMethodDecoratorContext<any, any>) => {
    if(context.kind !== "method" ) {
        throw new Error("The RequestMapping can not use with other class decorator");
    }
    if(!value["isRequestMapping"]) {
        throw new Error("The GetParam decorator should be used after RequestMapping decorator.");
    }
    return function(...args: any[]) {
        const adapter: Adapter = args[0];
        const reset = args.filter((value, index) => index > 0);
        const params = adapter.getParam(opt, ...reset);console.log("----Params---", params);
        return value(...params);
    }
};

export const RequestMapping = (pathname: string, method?: keyof typeof RequestMethod) => (value: Function, context: ClassMethodDecoratorContext<any>) =>{
    if(context.kind !== "method" ) {
        throw new Error("The RequestMapping can not use with other class decorator");
    }
    const requestCallback = function<This>(this: This, ...args: any[]) {
        return value(...args);
    };
    requestCallback["isRequestMapping"] = true;
    requestDataStore.tempRequest.push({
        url:pathname,
        method,
        callback: requestCallback,
        callbackName: context.name
    });
    return requestCallback;
};

export const createRequestRoutes = (adapter: Adapter, useParamsHandle: Function, responseHandle: Function) => {
    // requestMapping.forEach(callback => callback());
    const routes: IDefineRoute[] = requestDataStore.requests || [];
    const routeHandler = (route: IDefineRoute, ...args: any[]) => {
        // Reflect.defineMetadata(META_KEY_MODULE_ID, adapter);
        const instanceId = Reflect.getMetadata(META_KEY_INSTANCE_ID, adapter);
        const requestId = uuid();
        const constroller = createInstance(route.Target, {
            instanceId: instanceId,
            requestId: requestId
        });
        return utils.invokeEx(constroller, route.callbackName, adapter, route, ...args);
    };
    const spaceLength = 10;
    routes.forEach((routeData) => {
        ((route) => {
            const url = ((route.baseName ?? "") + route.url).replace(/\/{1,}/g, "/");
            const log = `[${route.method}]${" ".repeat(spaceLength - route.method.length)} ${url}`;
            const routeConfig = {...route, url };
            switch(route.method) {
                case "GET": {
                    adapter.get(url, (...args: any[]) => {
                        const response = routeHandler(routeConfig, ...args);
                        return responseHandle(response, ...args);
                    });
                    break;
                }
                case "POST": {
                    adapter.post(url, (...args: any[]) => {
                        const response = routeHandler(routeConfig, ...args);
                        return responseHandle(response, ...args);
                    });
                    break;
                }
                case "OPTIONS": {
                    adapter.post(url, (...args: any[]) => {
                        const response = routeHandler(routeConfig, ...args);
                        return responseHandle(response, ...args);
                    });
                    break;
                }
                case "DELETE": {
                    adapter.delete(url, (...args: any[]) => {
                        const response = routeHandler(routeConfig, ...args);
                        return responseHandle(response, ...args);
                    });
                    break;
                }
                case "PUT": {
                    adapter.put(url, (...args: any[]) => {
                        const response = routeHandler(routeConfig, ...args);
                        return responseHandle(response, ...args);
                    });
                    break;
                }
                default: {
                    throw new Error("Method not support");
                }
            }
            console.log(log);
        })(routeData);
    });
}

export const defineRoute = (baseName: string, Target: new(...args: any[]) => any) => {
    const reqList = requestDataStore.tempRequest.map((item) => ({
        ...item,
        baseName,
        Target
    }));
    requestDataStore.requests.push(...reqList);
};
