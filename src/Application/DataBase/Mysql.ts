import { DataBaseEngine } from "./DataBaseEngine";
import { AppService } from "../../Annotation";
import mysql from "mysql";

@AppService
export class Mysql extends DataBaseEngine {
    dispose(): void {
        throw new Error("Method not implemented.");
    }
    private conn!: mysql.Connection;
    closeConnection(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    loadConnection(): void {
        if(!this.conn) {
            this.conn = mysql.createConnection({
                host: this.config.host || '127.0.0.1',
                port: this.config.port || 3306,
                user: this.config.user,
                password: this.config.password,
                database: this.config.dataBase,
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
}
