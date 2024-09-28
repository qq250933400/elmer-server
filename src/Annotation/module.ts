import { utils } from "elmer-common";
import { v7 as uuid } from "uuid";
import {
    META_KEY_MODULE_TYPE,
    META_KEY_MODULE_ID,
    META_VALUE_MODULE_APPSERVICE,
    META_VALUE_MODULE_REQUEST
} from "../data/constants";


interface IModuleData {
    factory: Record<string, new(...args: any[]) => any>;
    instance: Record<string, Object>;
}

interface IDefineModuleOption {
    errmsg?: string;
    moduleId?: string;
}

const moduleData: IModuleData = {
    factory: {},
    instance: {}
};
export const defineModule = (Target: new(...args: any[]) => any, CONST_MODULE_TYPE: string, opt?: IDefineModuleOption) => {
    const oldModuleType = Reflect.getMetadata(META_KEY_MODULE_TYPE, Target);
    const mid = opt?.moduleId || uuid();
    if(!utils.isEmpty(oldModuleType)) {
        throw new Error(opt?.errmsg || "The module can not use with other class decorator.");
    }
    if(moduleData.factory[mid]) {
        throw new Error(`The module can not be defined, module id ready exists. (${mid})`);
    }
    Reflect.defineMetadata(META_KEY_MODULE_TYPE, CONST_MODULE_TYPE, Target);
    Reflect.defineMetadata(META_KEY_MODULE_ID, mid, Target);
    moduleData.factory[mid] = Target;
};

/**
 * check the target is a valid module
 * @param Target - detect target class
 * @returns 
 */
export const validateModule = (Target: new(...args: any[]) => any) => {
    const moduleId = Reflect.getMetadata(META_KEY_MODULE_ID, Target);
    return !utils.isEmpty(moduleData.factory[moduleId]);
};

export const validateModuleEx = (Target: new(...args: any[]) => any, moduleType: string) => {
    const saveModuleType = Reflect.getMetadata(META_KEY_MODULE_TYPE, Target);
    return validateModule(Target) && saveModuleType === moduleType;
};

export const getModuleId = (Target: new(...args: any[]) => any) => {
    return Reflect.getMetadata(META_KEY_MODULE_ID, Target);
};

export const AppService = (Factory: new(...args: any[]) => any) => {
    defineModule(Factory, META_VALUE_MODULE_APPSERVICE);
};

export const AppRequest = (Factory: new(...args: any[]) => any) => {
    defineModule(Factory, META_VALUE_MODULE_REQUEST);
};
