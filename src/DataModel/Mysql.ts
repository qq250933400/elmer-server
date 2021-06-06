import { ADataEngine } from "./ADataEngine";
import * as mysql from "mysql";
import { Connection } from "mysql";
import utils from "../core/utils";
import * as fs from 'fs';
import { HtmlParse } from "elmer-virtual-dom";
import { GetGlobalObject } from "../core/BootApplication";
import { pluginExec } from "../plugin/PluginExec";

export class Mysql extends ADataEngine {
    connection: Connection;

    @GetGlobalObject("htmlParse")
    private htmlParse: HtmlParse;

    connect(): void {
        this.connection = this.createConnection();
        this.connection.connect();
    }
    dispose(): void {
        this.connection.destroy();
    }
    createQuery(data) {
        console.log(data);
        return "" as any;
    }
    query<T={}>(queryString: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.connection.query(queryString, (error, result, fields) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result as any);
                }
            });
        });
    }
    readDataSource(fileName: string): any {
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
    }
    parameterization(query, params): any {
        return pluginExec(["Request"], "MysqlPlugin", "parameterization", query, params, (value, key) => {
            console.log("Checking", value, key);
        });
    }
    private createConnection<Connection>(): Connection {
        return mysql.createConnection({
            port: this.config.port || 3306,
            user: this.config.user,
            password: utils.aseDecode(this.config.password),
            host: this.config.host,
            database: this.config.dataBase
        }) as any;
    }
}
