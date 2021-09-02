import { ADataEngine } from "./ADataEngine";
import * as mysql from "mysql";
import { Connection, Pool } from "mysql";
import { getLogger } from "../logs";
import { Logger } from "log4js";
import utils from "../core/utils";
import * as fs from 'fs';
import * as path from "path";
import { HtmlParse, IVirtualElement } from "elmer-virtual-dom";
import { GetGlobalObject } from "../core/BootApplication";
import { pluginExec } from "../plugin/PluginExec";
import { DECORATORS_DATAMODEL_OPTIONS } from "./ADataModel";

export class Mysql extends ADataEngine {
    connection: Connection;
    poolObj: Pool;
    isConnected: boolean = false;

    @GetGlobalObject("htmlParse")
    private htmlParse: HtmlParse;
    private logger: Logger;
    constructor() {
        super();
        this.logger = getLogger();
    }
    connect(): Promise<any> {
        this.poolObj = this.createConnection();
        this.logger.debug("Mysql_1. 创建数据库连接");
        return new Promise<any>((resolve, reject) => {
            if(!this.connection || !this.isConnected) {
                this.poolObj.getConnection((err, connection) => {
                    if(err) {
                        this.logger.debug("Mysql_2.1. 数据库连接失败.", err);
                        reject(err);
                    } else {
                        this.connection = connection;
                        this.isConnected = true;
                        this.connectedDateTime = (new Date()).toLocaleDateString();
                        this.logger.debug("Mysql_2.2. 数据库连接成功.");
                        resolve({});
                    }
                });
            } else {
                this.logger.debug("Mysql_2.3. 从缓存获取连接池")
                resolve({});
            }
        });
    }
    dispose(): void {
        this.logger.debug("Mysql_3. 释放数据库连接");
        this.poolObj && this.poolObj.end((err) => {
            if(err) {
                this.fire("onError", err);
            }
            this.isConnected = false;
            this.logger.debug("Mysql_4. 数据库连接已释放.");
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
    readDataSource(options: any, rootPath: string): any {
        try {
            if(utils.isString(options)) {
                return {
                    default: this.readSourceFile(path.resolve(rootPath, options as string))
                };
            } else if(utils.isObject(options)) {
                const data: any = {};
                Object.keys(options).forEach(key => {
                    const fileName = path.resolve(rootPath, options[key]);
                    data[key] = this.readSourceFile(fileName);
                });
                return data;
            } else {
                throw new Error("Data Source not found.");
            }
        }catch(e) {
            this.logger.error(e);
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
    parameterization(query:any, params:any, id: string): Promise<any> {
        /*
        (value, key) => {
            const exResult = pluginExec(["Request"], "MysqlPlugin", "parameterValidate", value, id);
            return exResult;
        }*/
        return pluginExec(["Model"], "DataModelPlugin", "parameterization", query, params, id);
    }
    private readSourceFile(fileName: string): IVirtualElement[] {
        if (!/\.mysql/.test(fileName)) {
            throw new Error("Mysql数据层Source文件类型不正确,只支持mysql类型。" + fileName);
        } else if (!fs.existsSync(fileName)) {
            throw new Error("Mysql数据层Source文件不存。" + fileName);
        }
        const sourceValue = fs.readFileSync(fileName, 'utf8');
        if (!utils.isEmpty(sourceValue)) {
            const obj = this.htmlParse.parse(sourceValue);
            return obj.children;
        } else {
            throw new Error("指定数据源文件没有内容。");
        }
    }
    private createConnection(): Pool {
        const loginInfo = {
            connectionLimit: 5,
            host: this.config.host,
            port: this.config.port,
            password: !utils.isEmpty(this.config.password) ? utils.aseDecode(this.config.password) : "",
            database: this.config.dataBase,
            user: this.config.user
        };
        this.logger.debug(JSON.stringify(loginInfo));
        return mysql.createPool(loginInfo);
    }
}
