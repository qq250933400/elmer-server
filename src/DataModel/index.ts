import { ADataEngine } from "./ADataEngine";
import { DBConfig } from "../config";
import { IConfigDB } from "../config/IConfigDB";
import { Mysql } from "./Mysql";
import { GetLogger } from "../logs";
import { Logger } from "log4js";
import utils from "../core/utils";
import DefineDecorator from "../core/DefineDecorator";
import { DECORATOR_MODEL_TYPE } from "../core/GlobalStore";
import * as path from "path";

type TypeSecurityQueryCallback = (model: DataModel) => Promise<any>;

export const BindModelSource = (modelSource: string) => {
    return (Target: new(...args:any[]) => any) => {
        DefineDecorator(() => {
            Reflect.defineMetadata(DECORATOR_MODEL_TYPE, "DataModel", Target);
            Reflect.defineMetadata("ModelSource", modelSource, Target.prototype);
        }, Target);
    };
};

export class DataModel {
    @DBConfig()
    private config: IConfigDB;
    @GetLogger()
    private logger: Logger;

    private dataEngine: ADataEngine;
    private sourceFileName: string;
    private sourceData: any[];
    constructor() {
        const fileName = Reflect.getMetadata("ModelSource", this);
        const localSourceFile = path.resolve(this.config.sourcePath, fileName);
        if(this.config.type === "Mysql") {
            this.dataEngine = new Mysql();
        }
        this.sourceFileName = localSourceFile;
    }
    connect(): void {
        this.dataEngine.connect();
    }
    destory(): void {
        this.dataEngine.dispose();
    }
    async securityQuery(fn: TypeSecurityQueryCallback): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let resultData: any;
            try{
                this.connect();
                resultData = fn(this);
            } catch(e) {
                this.logger.error(e.stack || e.message);
                reject({
                    statusCode: e.statusCode,
                    message: "系统内部错误"
                });
            } finally {
                this.destory();
            }
            if(utils.isPromise(resultData)) {
                resultData
                    .then((respData) => resolve(respData))
                    .catch((err) => reject(err));
            } else {
                resolve(resultData);
            }
        }); 
    }
    async query<T={}>(id: string, parameters?: any): Promise<T> {
         return new Promise<T>((resolve, reject) => {
            if(!this.sourceData) {
                this.sourceData = this.dataEngine.readDataSource(this.sourceFileName);
            }
            if(utils.isArray(this.sourceData) && this.sourceData?.length > 0) {
                let query = null;
                for(const qr of this.sourceData) {
                    if((qr as any).tagName === "query" && (qr as any)?.props?.id === id) {
                        query = (qr as any).action || (qr as any).innerHTML;
                        break;
                    }
                }
                if(!utils.isEmpty(query)) {
                    const queryValue = this.dataEngine.parameterization(query, parameters);
                    console.log("-------",queryValue);
                    resolve(queryValue as any)
                } else {
                    reject({
                        statusCode: "DB_405",
                        message: `未实现数据操作${id}`
                    });
                }
            } else {
                reject({
                    statusCode: "DB_404",
                    message: "数据层操作不存在。"
                });
            }
         });
    }
}