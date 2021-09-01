import { ADataEngine } from "./ADataEngine";
import { DBConfig } from "../config";
import { IConfigDB } from "../config/IConfigDB";
import { Mysql } from "./Mysql";
import { GetLogger } from "../logs";
import { Logger } from "log4js";
import utils from "../core/utils";
import { queueCallFunc } from "elmer-common";
import * as path from "path";
import { TypeDefineDataModelOption } from "./ADataModel";

type TypeSecurityQueryOptions = {
    connection: any;
    query<T={}>(id: string, params: any): Promise<T>;
};
type TypeSecurityQueryCallback = (options: TypeSecurityQueryOptions) => Promise<any>;

export abstract class DataModel {
    static flag: string = "DataModel_4bf1a9a9-6c15-4556-8521-4855e3a06cee";

    public readonly ssid: string;

    @GetLogger()
    public logger: Logger;

    @DBConfig()
    private config: IConfigDB;

    private dataEngine: ADataEngine;
    private sourceConfig: string | object;
    private sourceData: any[];
    constructor(sessionId: string, options: TypeDefineDataModelOption) {
        if(this.config.type === "Mysql") {
            this.dataEngine = new Mysql();
        }
        if(utils.isEmpty(sessionId)) {
            throw new Error("DataModel必须使用GetDataModel注解引入");
        }
        this.ssid = sessionId;
        this.dataEngine.on("onError", (err) => {
            this.logger.error(err?.stack || err?.sqlMessage || err?.message || "Unknow error.[DataEngine]");
        });
        this.sourceConfig = options.source;
        console.log("---", this.sourceConfig);
    }
    destory(): void {
        this.dataEngine.dispose();
    }
    async connect(): Promise<any> {
        return this.dataEngine.connect();
    }
    async insert?<D={}, T={}>(id: string, params: D): Promise<T>;
    async delete?<D={}, T={}>(id: string, params: D): Promise<T>;
    async update?<D={}, T={}>(id: string, params: D): Promise<T>;
    async query(id: string, params: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            queueCallFunc([
                {
                    id: "connect",
                    params: {},
                    fn: ():any => {
                        if(!this.dataEngine.connection) {
                            return this.dataEngine.connect();
                        }
                    }
                }, {
                    id: "query",
                    params: {},
                    fn: () => this.connectionQuery(this.dataEngine.connection, id, params)
                }
            ], null, {
                throwException: true
            }).then((data) => {
                resolve(data.query);
            }).catch((err) => {
                console.error(err);
                this.logger.error(err.exception || err.trace || err.message, "[Model_Query]");
                reject(err.exception);
            });
        });
    }
    private async connectionQuery<T={}>(connection: any, id: string, parameters?: any): Promise<T> {
         return new Promise<T>((resolve, reject) => {
            if(!connection) {
                reject({
                    statusCode: "DB_406",
                    message: "连接失效"
                });
                return;
            }
            let query = this.getQuerySource(id);
            if(!utils.isEmpty(query)) {
                this.logger.debug("[DB]", query);
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
         });
    }
    private getQuerySource(id: string, type: "Query"|"Insert"|"Update"|"Delete" | "None" = "None"):string {
        if(!this.sourceData) {
            this.sourceData = this.dataEngine.readDataSource(this.sourceConfig, this.config.sourcePath);
        }
        if(this.sourceData) {
            const rootKey = id.match(/^([a-z0-9_\-]{1,})\.([a-z0-9_\-]{1,})$/);
            let query = null;
            for(const srcKey of Object.keys(this.sourceData)) {
                const curSource = this.sourceData[srcKey];
                if((rootKey && rootKey[1] === srcKey) || (!rootKey && srcKey === "default")) {
                    const checkKey = rootKey ? rootKey[2] : id;
                    for(const qr of curSource) {
                        const cType = type.toLowerCase();
                        if((type === "None" || (cType === (qr as any).tagName)) && qr.props?.id === checkKey) {
                            query = (qr as any).action || (qr as any).innerHTML;
                            break;
                        }
                    }
                }
            }
            return query;
        }
    }
}