import { DataBaseEngine } from "./DataBaseEngine";
import { AppService } from "../../Annotation";
import { IConfigDB } from "../../Config/interface/IConfigDB";
import mysql from "mysql";

@AppService
export class Mysql extends DataBaseEngine {
   
    private conn!: mysql.Connection;
    private isConnected!: boolean;
    closeConnection(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    dispose(): void {
        this.isConnected && this.conn && this.conn.end();
        this.isConnected = false;
    }
    loadConnection(config: IConfigDB): void {
        if(!this.conn) {
            this.conn = mysql.createConnection({
                host: config.host || '127.0.0.1',
                port: config.port || 3306,
                user: config.user,
                password: config.password,
                database: config.database,
                multipleStatements: true
            });
            this.conn.on("error", (err) => {
                this.error(err?.message,err.stack);
            });
            this.conn.on("close", () => {
                this.conn = null;
                this.isConnected = false;
            });
        }
    }
    connect() {
        return new Promise((resolve, reject) => {
            if(!this.isConnected) {
                this.conn.connect((err) => {
                    if(err) {
                        this.error(err.errno.toString(),err.stack);
                        this.isConnected = false;
                        reject(err);
                    } else {
                        this.log.debug(`Connected to MySQL`);
                        this.isConnected = true;
                        resolve(true);
                    }
                });
            } else {
                this.isConnected = true;
            }
        });
    }
    query(sql: string, params?: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            this.connect().then(() => {
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
            }).catch(reject);
        });
    }
    beginTransaction(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.connect().then(() => {
                this.conn.beginTransaction((err) => {
                    if(err) {
                        this.error(err.errno.toString(),err.stack);
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            }).catch(reject);
        });
    }
    commit(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.conn.commit((err) => {
                if(err) {
                    this.error(err.errno.toString(),err.stack);
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }
    rollback(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.conn.rollback((err) => {
                if(err) {
                    this.error(err.errno.toString(),err.stack);
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }
}
