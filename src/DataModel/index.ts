import { ADataEngine } from "./ADataEngine";
import { DBConfig } from "../config";
import { IConfigDB } from "../config/IConfigDB";
import { Mysql } from "./Mysql";
import { GetLogger } from "../logs";
import { Logger } from "log4js";
import utils from "../core/utils";
import DefineDecorator from "../core/DefineDecorator";
import { Model, queueCallFunc } from "elmer-common";
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
        console.log("--------DataModel---Application--Init--");
    }
    async connect(): Promise<any> {
        return this.dataEngine.connect();
    }
    destory(): void {
        this.dataEngine.dispose();
    }
    async query(id: string, params: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            console.log("------Query---: ", this.dataEngine.isConnected, this.dataEngine.connection);
            console.log("------QueryTime---: ", this.dataEngine.connectedDateTime);
            this.connectionQuery(this.dataEngine.connection, id, params)
                .then(resolve)
                .catch((err) => {
                    this.logger.error(err.trace || err.message, "[Model_Query]");
                    reject(err);
                });
        });
    }
    async securityQuery(fn: TypeSecurityQueryCallback): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            queueCallFunc([
                {
                    id: "connect",
                    params: {},
                    fn: () => this.dataEngine.connect()
                },
                {
                    id: "queryData",
                    params: {},
                    fn: ({ lastResult }) => {
                        console.log("------5", this.dataEngine.isConnected);
                        console.log("------Time: ", this.dataEngine.connectedDateTime);
                        return fn({
                            connection: lastResult,
                            query: (id: string, params: any) => this.connectionQuery(lastResult, id, params)
                        });
                    }
                },
                {
                    id: "destroy",
                    params: {},
                    fn: ():any => this.destory()
                }
            ]).then((resp) => {
                console.log("------7", this.dataEngine.isConnected);
                if(!utils.isEmpty(resp.queryData?.statusCode)) {
                    delete resp.connect;
                    this.logger.error(resp.queryData);
                    reject(resp.queryData);
                } else {
                    resolve(resp.queryData);
                }
            }).catch((err) => {
                reject(err);
            });
        });
    }
    private async connectionQuery<T={}>(connection: any, id: string, parameters?: any): Promise<T> {
         return new Promise<T>((resolve, reject) => {
            if(!this.sourceData) {
                this.sourceData = this.dataEngine.readDataSource(this.sourceFileName);
            }
            if(!connection) {
                reject({
                    statusCode: "DB_406",
                    message: "连接失效"
                });
                return;
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
                    console.log("---------4", this.dataEngine.isConnected);
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