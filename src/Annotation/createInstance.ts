import {
    META_KEY_MODULE_ID,
    META_KEY_INSTANCE_ID,
    META_KEY_REQUEST_ID,
    META_KEY_MODULE_TYPE,
    META_VALUE_BOOT_APPLICATION,
    META_VALUE_MODULE_APPSERVICE,
    META_VALUE_MODULE_REQUEST
} from "../data/constants";
import { validateModule, getModuleId } from "./module";
import utils from "../utils/utils";
import { IAnnotationOption } from "../interface/IAnnotation";

const instanceData = {};

export const createInstance = <Factory extends new(...args: any[]) => any>(
    Target: Factory,
    opt: IAnnotationOption,
    ...params: any[]
): InstanceType<Factory> => {
    const instanceId = opt.instanceId;
    const moduleType = Reflect.getMetadata(META_KEY_MODULE_TYPE, Target);
    let instanceObj: any = instanceData[instanceId];
    let moduleObj: any;
    if(utils.isEmpty(instanceId)) {
        console.error(Target);
        throw new Error(`创建示例失败，instanceId未定义。(${instanceId})`);
    }
    if(!validateModule(Target)) {
        console.error(Target, validateModule(Target));
        throw new Error("Module is not valid");
    }
    if(!instanceObj) {
        // 创建instance示例，创建示例存储节点
        instanceObj = {
            obj: null,
            service: {},
            request: {}
        };
        instanceData[instanceId] = instanceObj;
    }
    switch(moduleType) {
        case META_VALUE_BOOT_APPLICATION: {
            if(instanceObj.obj) {
                return instanceObj.obj;
            } else {
                moduleObj = new Target(opt, ...params);
                instanceObj.obj = moduleObj;
            }
            break;
        }
        case META_VALUE_MODULE_APPSERVICE: {
            const mid = getModuleId(Target);
            if(instanceObj.service[mid]) {
                return instanceObj.service[mid];
            } else {
                moduleObj = new Target(...[opt, ...params]);
                instanceObj.service[mid] = moduleObj;
            }
            break;
        }
        case META_VALUE_MODULE_REQUEST: {
            if(!opt || utils.isEmpty(opt.requestId)) {
                throw new Error("requestId cannot be empty");
            }
            if(!instanceObj?.request) {
                throw new Error(`The request instance not exists.`);
            }
            if(opt?.requestId && !instanceObj.request[opt.requestId]) {
                instanceObj.request[opt.requestId] = {};
            }
            const mid = getModuleId(Target);
            if(opt.requestId && instanceObj.request[opt.requestId][mid]) {
                moduleObj = instanceObj.request[opt.requestId][mid];
            } else {
                moduleObj = new Target(...[opt, ...params]);
            }
            Reflect.defineMetadata(META_KEY_REQUEST_ID, opt.requestId, moduleObj);
            break;
        }
        default: {
            if(typeof Target === "function") {
                moduleObj = new Target(...params);
            } else {
                moduleObj = Target;
            }
        }
    }
    Reflect.defineMetadata(META_KEY_INSTANCE_ID, instanceId, moduleObj);
    return moduleObj;
};


export const getModuleObj = <ModuleFactory extends new(...args: any[]) => any>(Factory: ModuleFactory, instanceId: string): InstanceType<ModuleFactory>|undefined => {
    const mid = getModuleId(Factory);
    const mtype = Reflect.getMetadata(META_KEY_MODULE_TYPE, Factory);
    const instanceObj = instanceData[instanceId];
    if(!instanceObj) {
        return undefined;
    }
    if(mtype === META_VALUE_MODULE_APPSERVICE) {
        return instanceObj.service[mid];
    } else if(mtype === META_VALUE_MODULE_REQUEST) {
        console.error("todo: not implements");
    }
};
export const getModuleById = (instanceId: string, moduleId: string) => {
    const instanceObj = instanceData[instanceId];
    if(!instanceObj) {
        return undefined;
    }
    return instanceObj.service[moduleId] || instanceObj.request[moduleId];
};
/**
 * 此方法用于在Adapter中获取模块实例，在其他模块调用时请使用，AppModel注入的方式
 * @param Target - 初始化模块
 * @param owenBy - 调用模块所在类
 * @returns 
 */
export const createInstanceInApp = <Factory extends new(...args: any[]) => any>(Target: Factory, owenBy: Object, ...args: any[]) => {
    const instanceId = Reflect.getMetadata(META_KEY_INSTANCE_ID, owenBy);
    const requestId = Reflect.getMetadata(META_KEY_REQUEST_ID, owenBy);
    return createInstance(Target, {
        instanceId,
        requestId
    }, ...args);
}

export const releaseRequest = (instanceId: string, requestId: string) => {
    const instanceObj = instanceData[instanceId];
    if(instanceObj.request) {
        const reqObjs = instanceObj.request[requestId];
        if(reqObjs) {
            Object.keys(reqObjs).forEach((objId: string)=>{
                const obj = reqObjs[objId];
                typeof obj.destory === "function" && obj.destory();
                delete reqObjs[objId];
            });
            delete instanceObj.request[requestId];
        }
    }
};

export const getInstanceId = (targetObj: Object) => {
    return Reflect.getMetadata(META_KEY_INSTANCE_ID, targetObj);
};
