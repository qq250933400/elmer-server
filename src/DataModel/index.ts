import { ADataEngine } from "./ADataEngine";
import { DBConfig } from "../config";
import { IConfigDB } from "../config/IConfigDB";
import { Mysql } from "./Mysql";
import { GetLogger } from "../logs";
import { Logger } from "log4js";
import utils from "../core/utils";
import DefineDecorator from "../core/DefineDecorator";
import { DECORATOR_MODEL_TYPE } from "../core/GlobalStore";
import { Model } from "elmer-common";
import * as path from "path";
type TypeSecurityQueryOptions = {
    connection: any;
    query<T={}>(id: string, params: any): Promise<T>;
};
type TypeSecurityQueryCallback = (options: TypeSecurityQueryOptions) => Promise<any>;

export const BindModelSource = (modelSource: string) => {
    return (Target: new(...args:any[]) => any) => {
        DefineDecorator(() => {
            Model(Target);
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
        this.dataEngine.on("onError", (err) => {
            this.logger.error(err?.stack || err?.sqlMessage || err?.message || "Unknow error.[DataEngine]");
        });
        this.sourceFileName = localSourceFile;
    }
    connect(): Promise<any> {
        return this.dataEngine.connect();
    }
    destory(): void {
        this.dataEngine.dispose();
    }
    query(id: string, params: any): Promise<any> {
        return this.connectionQuery(this.dataEngine.connection, id, params);
    }
    async securityQuery(fn: TypeSecurityQueryCallback): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            try{
                this.connect()
                    .then((connection) => {
                        const conResp = fn({
                            connection,
                            query: (id: string, params: any) => this.connectionQuery(connection, id, params)
                        });
                        if(utils.isPromise(conResp)) {
                            conResp
                                .then((resp) => {
                                    resolve(resp);
                                    this.destory();
                                })
                                .catch((err) => {
                                    if(!utils.isEmpty(err.sqlMessage)) {
                                        this.logger.error(err.sqlMessage || err.message, err.code);
                                    } else {
                                        this.logger.error(err.stack || err.message);
                                    }
                                    this.logger.error("QueryString: " + err.sql);
                                    this.destory();
                                    reject({
                                        statusCode: "DB_505",
                                        message: "query fail"
                                    });
                                });
                        } else {
                            throw new Error("securityQuery方法callback必须返回Promise对象。");
                        }
                    })
                    .catch((err) => {
                        this.logger.error(err.sqlMessage, err.code);
                        reject({
                            statusCode: "DB_500",
                            message: "create connection failed"
                        });
                    });
            } catch(e) {
                this.logger.error(e.stack || e.message);
                reject({
                    statusCode: e.statusCode,
                    message: "系统内部错误"
                });
                this.destory();
            }
        });
    }
    private async connectionQuery<T={}>(connection: any, id: string, parameters?: any): Promise<T> {
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
                    } else if((qr as any).tagName === "insert" && (qr as any)?.props.id === id) {
                        query = (qr as any).innerHTML;
                        break;
                    }
                }
                if(!utils.isEmpty(query)) {
                    const queryValue = this.dataEngine.parameterization(query, parameters, id);
                    this.dataEngine.query(connection, queryValue)
                        .then((mysqlData) => resolve(mysqlData as any))
                        .catch((err) => {
                            reject(err);
                        });
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