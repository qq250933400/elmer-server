import { DataBaseEngine } from "./DataBaseEngine";
import { AppService } from "../../Annotation";
import { IConfigDB } from "../../Config/interface/IConfigDB";
import mysql from "mysql";

@AppService
export class Mysql extends DataBaseEngine {
   
    private conn!: mysql.Connection;
    closeConnection(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    dispose(): void {
        throw new Error("Method not implemented.");
    }
    loadConnection(config: IConfigDB): void {
        if(!this.conn) {
            this.conn = mysql.createConnection({
                host: config.host || '127.0.0.1',
                port: config.port || 3306,
                user: config.user,
                password: config.password,
                database: config.dataBase,
                multipleStatements: true
            });
            this.conn.on("error", (err) => {
                this.error(err?.message,err.stack);
            });
            this.conn.on("close", () => {
                this.conn = null;
            });
        }
    }
    connect() {
        return new Promise((resolve, reject) => {
            this.conn.connect((err) => {
                if(err) {
                    this.error(err.errno.toString(),err.stack);
                    reject(err);
                } else {
                    this.log.debug(`Connected to MySQL`);
                    resolve(true);
                }
            });
        });
    }
    query(sql: string, params?: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.conn.query(sql, params,(err,result: any[], fields) => {
                if(err) {
                    console.error(err)
                    reject(err);
                } else {
                    resolve({
                        data: JSON.parse(JSON.stringify(result)),
                        fields: JSON.parse(JSON.stringify(fields))
                    });
                }
            });
        });
    }
}
