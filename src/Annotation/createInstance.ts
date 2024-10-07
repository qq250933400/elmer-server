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

interface IInitParams {
    instanceId: string;
    requestId?: string;
}

const instanceData = {};

const getParams = (Target: new(...args: any[]) => any, opt: IAnnotationOption) => {
    const paramtypes: any[] = Reflect.getMetadata("design:paramtypes", Target.prototype.constructor) || [];
    const paramList: any[] = [];
    console.log("++++GetParam---",  Target.prototype.constructor.parameters);
    paramtypes.forEach((param) => {
        if(validateModule(param)) {
            Reflect.defineMetadata(META_KEY_INSTANCE_ID, opt.instanceId, param);
            Reflect.defineMetadata(META_KEY_REQUEST_ID, opt.requestId, param);
            const obj = createInstance(param, opt);
            paramList.push(obj);
        } else {
            paramList.push(param);
        }
    });
    return paramList;
};
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
            if(utils.isEmpty(opt.requestId)) {
                throw new Error("requestId cannot be empty");
            }
            if(!instanceObj?.request) {
                throw new Error(`The request instance not exists.`);
            }
            if(!instanceObj.request[opt.requestId]) {
                instanceObj.request[opt.requestId] = {};
            }
            const mid = getModuleId(Target);
            if(instanceObj.request[opt.requestId][mid]) {
                return instanceObj.request[opt.requestId][mid];
            } else {
                return new Target(...[opt, ...params]);
            }
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