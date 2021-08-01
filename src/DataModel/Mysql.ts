import { ADataEngine } from "./ADataEngine";
import * as mysql from "mysql";
import { Connection, Pool } from "mysql";
import { getLogger } from "../logs";
import { Logger } from "log4js";
import utils from "../core/utils";
import * as fs from 'fs';
import { HtmlParse } from "elmer-virtual-dom";
import { GetGlobalObject } from "../core/BootApplication";
import { pluginExec } from "../plugin/PluginExec";

export class Mysql extends ADataEngine {
    connection: Connection;
    poolObj: Pool;

    @GetGlobalObject("htmlParse")
    private htmlParse: HtmlParse;
    private logger: Logger;
    constructor() {
        super();
        this.logger = getLogger();
    }
    connect(): Promise<any> {
        this.poolObj = this.createConnection();
        return new Promise<any>((resolve, reject) => {
            this.poolObj.getConnection((err, connection) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(connection);
                }
            });
        });
    }
    dispose(): void {
        this.poolObj.end((err) => {
            if(err) {
                this.fire("onError", err);
            }
        });
    }
    query<T={}, P={}>(connection: Connection, queryData: P): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const queryString = (queryData as any)?.queryString;
            this.logger.debug("Query: " + queryString, JSON.stringify((queryData as any)?.values || {}));
            connection.query(queryString, (queryData as any)?.values || [], (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(JSON.stringify(result as any)));
                }
            });
        });
    }
    readDataSource(fileName: string): any {
        try {
            if(!/\.mysql/.test(fileName)) {
                throw new Error("Mysql数据层Source文件类型不正确,只支持mysql类型。" + fileName);
            } else if(!fs.existsSync(fileName)) {
                throw new Error("Mysql数据层Source文件不存。" + fileName);
            }
            const sourceValue = fs.readFileSync(fileName, 'utf8');
            if(!utils.isEmpty(sourceValue)) {
                const obj = this.htmlParse.parse(sourceValue);
                return obj.children;
            } else {
                throw new Error("指定数据源文件没有内容。");
            }
        }catch(e) {
            this.fire("onError", {
                sqlMessage: e.message,
                stack: e.stack,
                code: e.code || e.statusCode || "DB_501"
            });
        }
    }
    /**
     * 查询参数初始化
     * @param query 查询语句
     * @param params 查询参数
     * @param id 查询过程ID
     * @returns 
     */
    parameterization(query:any, params:any, id: string): any {
        const parameterizationResult = pluginExec(["Request"], "MysqlPlugin", "parameterization", query, params, id, (value, key) => {
            const exResult = pluginExec(["Request"], "MysqlPlugin", "parameterValidate", value, id);
            return exResult;
        });
        return parameterizationResult;
    }
    private createConnection(): Pool {
        return mysql.createPool({
            connectionLimit: 5,
            host: this.config.host,
            port: this.config.port,
            password: !utils.isEmpty(this.config.password) ? utils.aseDecode(this.config.password) : "",
            database: this.config.dataBase,
            user: this.config.user
        });
    }
}
