import { Adapter } from "../Core/Adapter";
import { META_VALUE_MODULE_PARAM, META_KEY_INSTANCE_ID } from "../../data/constants";
import { createInstance, releaseRequest, getInstanceId } from "../../Annotation/createInstance";
import { validateModule } from "../../Annotation/module";
import { Schema } from "../../Validation/Schema";
import { Exception } from "../Core/Exception";

import type { ISchemaConfig } from "../../Validation/ISchemaValidation";
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

interface IRequestDataStore {
    tempRequest: any[];
    requests: any[];
}

interface IMappingOptions {
    /** 自定义输出内容，正常结束后不触发response.send()方法 */
    takeOver?: boolean;
}

export interface IDefineRoute extends IDefineRequest {
    baseName: string;
    Target: new(...args: any[]) => any;
}

export interface IDefineRequestParam {
    type: 'Body'|'PathParam'|'QueryParam'|'Header'|'Cookie'|'Request'|'Response'|'SessionId',
    args?: any[]| string;
}

const requestDataStore: IRequestDataStore = {
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
        const params = adapter.getParam(opt, ...reset);
        return value.call(this, ...params);
    }
};

export const RequestMapping = (pathname: string, method?: keyof typeof RequestMethod, options?: IMappingOptions) => (value: Function, context: ClassMethodDecoratorContext<any>) =>{
    if(context.kind !== "method" ) {
        throw new Error("The RequestMapping can not use with other class decorator");
    }
    const requestCallback = function<This>(this: This, ...args: any[]) {
        return value.call(this, ...args);
    };
    requestCallback["isRequestMapping"] = true;
    requestDataStore.tempRequest.push({
        url:pathname,
        method,
        options,
        callback: requestCallback,
        callbackName: context.name
    });
    return requestCallback;
};

export const Get = (pathname: string, options?: IMappingOptions) => RequestMapping(pathname, "GET", options);
export const Post = (pathname: string, options?: IMappingOptions) => RequestMapping(pathname, "POST", options);
export const Delete = (pathname: string, options?: IMappingOptions) => RequestMapping(pathname, "DELETE", options);
export const Put = (pathname: string, options?: IMappingOptions) => RequestMapping(pathname, "PUT", options);
export const Options = (pathname: string, options?: IMappingOptions) => RequestMapping(pathname, "OPTIONS", options);

export const createRequestRoutes = (adapter: Adapter, beforeHandler: Function, responseHandle: Function) => {
    // requestMapping.forEach(callback => callback());
    const routes: IDefineRoute[] = requestDataStore.requests || [];
    const initInjectParams = (paramsList: any[],instanceId: string, requestId: string) => {
        const newParams: any[] = [];
        // 初始化传入Factory参数
        paramsList.forEach((item) => {
            if(validateModule(item)) {
                const obj = createInstance(item, {
                    instanceId,
                    requestId
                });
                newParams.push(obj);
            } else {
                newParams.push(item);
            }
        });
        return newParams;
    };
    const routeHandler = (route: IDefineRoute, beforeHandler: Function, ...args: any[]) => {
        // Reflect.defineMetadata(META_KEY_MODULE_ID, adapter);
        const instanceId = Reflect.getMetadata(META_KEY_INSTANCE_ID, adapter);
        const requestId = uuid();
        const injectParams = Reflect.getMetadata(META_VALUE_MODULE_PARAM, route.Target);
        const injectParamList = initInjectParams(injectParams || [], instanceId, requestId);
        const controller = createInstance(route.Target, {
            instanceId: instanceId,
            requestId: requestId
        }, ...injectParamList);

        return new Promise((resolve, reject)=> {
            beforeHandler(...args);
            try {
                utils.invokeEx(controller, route.callbackName, adapter, route, ...args)
                    .then((resp) => {
                        resolve({ data: resp, route });
                        releaseRequest(instanceId, requestId);
                    }).catch((err) => {
                        reject(err);
                        releaseRequest(instanceId, requestId);
                    });
            }catch(e) {
                reject(e);
                console.error(e);
            }
        })
    };
    const spaceLength = 10;
    const beforeSpace = 4;
    const routeLogs: string[] = [];
    const beforeSpaceStr = " ".repeat(beforeSpace);
    routes.forEach((routeData) => {
        ((route) => {
            const url = ((route.baseName ?? "") + route.url).replace(/\/{1,}/g, "/");
            const log = `[${route.method}]${" ".repeat(spaceLength - route.method.length)} ${url}`;
            const routeConfig = {...route, url };
            switch(route.method) {
                case "GET": {
                    adapter.get(url, (...args: any[]) => {
                        const response = routeHandler(routeConfig, beforeHandler, ...args);
                        return responseHandle(response, ...args);
                    });
                    break;
                }
                case "POST": {
                    adapter.post(url, (...args: any[]) => {
                        const response = routeHandler(routeConfig, beforeHandler, ...args);
                        return responseHandle(response, ...args);
                    });
                    break;
                }
                case "OPTIONS": {
                    adapter.post(url, (...args: any[]) => {
                        const response = routeHandler(routeConfig, beforeHandler, ...args);
                        return responseHandle(response, ...args);
                    });
                    break;
                }
                case "DELETE": {
                    adapter.delete(url, (...args: any[]) => {
                        const response = routeHandler(routeConfig, beforeHandler, ...args);
                        return responseHandle(response, ...args);
                    });
                    break;
                }
                case "PUT": {
                    adapter.put(url, (...args: any[]) => {
                        const response = routeHandler(routeConfig, beforeHandler, ...args);
                        return responseHandle(response, ...args);
                    });
                    break;
                }
                default: {
                    throw new Error("Method not support");
                }
            }
            //console.log(log); // 打印路径信息
            routeLogs.push(`${beforeSpaceStr} ${log}`);
        })(routeData);
    });
    return routeLogs;
}

export const defineRoute = (baseName: string, Target: new(...args: any[]) => any) => {
    const reqList = requestDataStore.tempRequest.map((item) => ({
        ...item,
        baseName,
        Target
    }));
    requestDataStore.tempRequest = []; // 清空临时路由注册缓存
    requestDataStore.requests.push(...reqList);
};

export const RBValidate = <Data, FormatCallback extends Record<string, Function>, OptionalField>(schema: ISchemaConfig<Data, FormatCallback, OptionalField>, format?: FormatCallback) => (value: Function, context: ClassMethodDecoratorContext<any, any>) => {
    if(context.kind !== "method" ) {
        throw new Error("The RBValidate can not use with other class decorator");
    }
    return function(...args: any[]) {
        const adapter: Adapter = args[0];
        const reset = args.filter((_, index) => index > 0);
        const requestBody = adapter.getParam([{ type: "Body" }], ...reset)[0];
        const instanceId = getInstanceId(this as any);
        const schemaObj = createInstance(Schema, {
            instanceId
        });
        const validationResult = schemaObj.validate(requestBody, schema, format);
        if(!validationResult.positive) {
            throw new Exception(500,`The request body is not match the validation schema.`, "vd-Failed", validationResult.negative);
        }
        return value.call(this, ...args);
    }
};
