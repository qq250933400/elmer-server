import "reflect-metadata";
import { DECORATORS_CLASS_TYPE, DECORATORS_MODEL_ID } from "elmer-common/lib/decorators/base";
import { utils } from "elmer-common";

const dataModel = {
    objPool: {}
};

export type TypeDefineDataModelOption<S={}, M={}> = {
    source: {[P in keyof S]: string} | string;
    useModel?: {[P in keyof M]: M[P]};
};

export const DECORATORS_CLASS_TYPE_DATAMODEL = "DECORATORS_CLASS_TYPE_DATAMODEL";
export const DECORATORS_DATAMODEL_OPTIONS = "DECORATORS_DATAMODEL_OPTIONS";

export const getModel = (sessionId: string, modelId: string) => {

}

export abstract class ADataModel {
    dataSource?(): string;
    destory?(): void;
    connect?(): Promise<void>;
    async query?<D={}, T={}>(id: string, params: D): Promise<T>;
    async insert?<D={}, T={}>(id: string, params: D): Promise<T>;
    async delete?<D={}, T={}>(id: string, params: D): Promise<T>;
    async update?<D={}, T={}>(id: string, params: D): Promise<T>;
}

export const DefineDataModel = (option: TypeDefineDataModelOption) => {
    return (Target: new(...args: any[]) => any) => {
        const classType = Reflect.getMetadata(DECORATORS_CLASS_TYPE, Target);
        if(utils.isEmpty(classType)) {
            Reflect.defineMetadata(DECORATORS_CLASS_TYPE, DECORATORS_CLASS_TYPE_DATAMODEL, Target);
            Reflect.defineMetadata(DECORATORS_DATAMODEL_OPTIONS, option, Target);
            Reflect.defineMetadata(DECORATORS_MODEL_ID, "dataModel_" + utils.guid(), Target);
        } else {
            throw new Error("DataModel不能使用DefineDataModel以外的装饰器。");
        }
    }
}

export const createDataModel = (ssid: string, Model: new(...args: any[]) => any): any => {
    const modelType = Reflect.getMetadata(DECORATORS_CLASS_TYPE, Model);
    if(utils.isEmpty(ssid)) {
        throw new Error("sessionId不能为空，必须使用GetDataModel注解引入模块。");
    }
    if(modelType !== DECORATORS_CLASS_TYPE_DATAMODEL) {
        throw new Error("定义引用模块必须使用DefineDataModel注解");
    } else {
        const moduleId = Reflect.getMetadata(DECORATORS_MODEL_ID, Model);
        if(!dataModel.objPool[ssid] || !dataModel.objPool[ssid][moduleId]) {
            const options = Reflect.getMetadata(DECORATORS_DATAMODEL_OPTIONS, Model);
            const obj = new Model(ssid, options);
            if(!dataModel.objPool[ssid]) {
                dataModel.objPool[ssid] = {};
            }
            dataModel.objPool[ssid][moduleId] = obj;
            return obj;
        } else {
            return dataModel.objPool[ssid][moduleId];
        }
    }
}

export const destroyDataModel = (ssid: string): void => {
    if(dataModel.objPool[ssid]) {
        Object.keys(dataModel.objPool[ssid]).map((moduleId: string) => {
            const moduleObj:any = dataModel.objPool[ssid][moduleId];
            typeof moduleObj.destory === "function" && moduleObj.destory();
            dataModel.objPool[ssid][moduleId] = null;
            delete dataModel.objPool[ssid][moduleId];
        });
        delete dataModel.objPool[ssid];
    }
}