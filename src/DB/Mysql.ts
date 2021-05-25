import { ADataEngine } from "./ADataEngine";
import * as mysql from "mysql";
import { Connection } from "mysql";
import utils from "../core/utils";

export class Mysql extends ADataEngine {
    connection: Connection;
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
