import { ADataEngine } from "./ADataEngine";
import { DBConfig } from "../config";
import { IConfigDB } from "../config/IConfigDB";
import { Mysql } from "./Mysql";
import { GetLogger } from "../logs";
import { Logger } from "log4js";
import utils from "../core/utils";

type TypeSecurityQueryCallback = (model: DataModel) => Promise<any>;

export class DataModel {
    @DBConfig()
    private config: IConfigDB;
    @GetLogger()
    private logger: Logger;

    private dataEngine: ADataEngine;
    private dataTableName: string;
    private conditions: any[] = [];
    constructor(tableName: string) {
        if(this.config.type === "Mysql") {
            this.dataEngine = new Mysql();
        }
        if(utils.isEmpty(this.config.prefix)) {
            this.dataTableName = tableName;
        } else {
            this.dataTableName = this.config.prefix + tableName;
        }
    }
    connect(): void {
        this.dataEngine.connect();
    }
    destory(): void {
        this.dataEngine.dispose();
    }
    async securityQuery(fn: TypeSecurityQueryCallback): Promise<any> {
        let resultData: any;
        try{
            this.connect();
            resultData = await fn(this);
        } catch(e) {
            this.logger.error(e.stack);
        } finally {
            this.destory();
        }
        return Promise.resolve(resultData);
    }
    async query<T={}>(queryCode: string): Promise<T> {
        this.logger.debug(queryCode);
        return this.dataEngine.query(queryCode);
    }
    where(condition: any[]): DataModel {
        this.conditions.push({
            type: "where",
            data: condition
        });
        return this;
    }
    select(): any {
        this.conditions.push({
            type: "select"
        });
    }
}