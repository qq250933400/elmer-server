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

interface IInitParams {
    instanceId: string;
    requestId?: string;
}

const instanceData = {};

const getParams = (Target: new(...args: any[]) => any, opt: IInitParams,) => {
    const paramtypes: any[] = Reflect.getMetadata("design:paramtypes", Target) || [];
    const paramList: any[] = [];
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
    opt: IInitParams,
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
                const initparams = getParams(Target, {
                    instanceId
                });
                const objParams = [
                    ...initparams,
                    ...params
                ];
                moduleObj = new Target(...objParams);
                instanceObj.obj = moduleObj;
            }
            break;
        }
        case META_VALUE_MODULE_APPSERVICE: {
            const mid = getModuleId(Target);
            if(instanceObj.service[mid]) {
                return instanceObj.service[mid];
            } else {
                const initparams = getParams(Target, {
                    instanceId
                });
                const objParams = [
                    ...initparams,
                    ...params
                ];
                moduleObj = new Target(...objParams);
                instanceObj.service[mid] = moduleObj;
            }
            break;
        }
        default: {
            console.error("undefined: ", Target);
        }
    }
    Reflect.defineMetadata(META_KEY_MODULE_TYPE, moduleType, moduleObj);
    return moduleObj;
};


export const getModuleObj = <ModuleFactory extends new(...args: any[]) => any>(Factory: ModuleFactory, instanceId: string): InstanceType<ModuleFactory>|undefined => {
    const mid = getModuleId(Factory);
    const mtype = Reflect.getMetadata(META_KEY_MODULE_TYPE, Factory);
    const instanceObj = instanceData[instanceId];
    if(!instanceObj) {
        return null;
    }
    if(mtype === META_VALUE_MODULE_APPSERVICE) {
        return instanceObj.service[mid];
    } else if(mtype === META_VALUE_MODULE_REQUEST) {
        console.error("todo: not implements");
    }
};