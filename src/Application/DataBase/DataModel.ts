import { IDataTableConfig } from "./Config";
import { createInstance } from "../../Annotation";
import { Connection } from "./Connection";
import { createSqlToken } from "./createSqlToken";
import { DataBaseSql } from "./token/ISql";
import utils from "../../utils/utils";

export const TableSymbol = Symbol("DataBaseTable");

export const TableConfigSymbol = Symbol("DataBaseTableConfig");


/**
 * 关系型数据库model, mysql, oracle
 */
export class DataModel {
    static readonly [TableConfigSymbol]: Symbol = TableSymbol;
    readonly tableName: string;
    readonly tableConfig: IDataTableConfig;
    
    private readonly conn!: Connection;
    private tableAlias: string;

    constructor(opt: any) {
        const instanceId = opt.instanceId;
        const requestId = opt.requestId;
        this.conn = createInstance(Connection, {
            instanceId,
            requestId
        });
        this.conn.init();
    }
    public where(conditions: DataBaseSql.TWhereConditions, logic: DataBaseSql.TWhereLogic = 'AND') {
        return createSqlToken({
            ...this.tableConfig,
            tablePrefix: this.conn.config.prefix,
            tableName: this.tableName,
            query: (sql, params) => {
                return new Promise((resolve, reject) => {
                    this.conn.query(sql, params)
                        .then((result) => {
                            resolve(result);
                        }).catch((error) => {
                            console.error(error);
                            reject(error);
                        });
                });
            }
        }).where(conditions, logic);
    }
    public alias(key: string) {
        this.tableAlias = key;
        return createSqlToken({
            ...this.tableConfig,
            tablePrefix: this.conn.config.prefix,
            tableName: this.tableName,
            query: (sql, params) => {
                return new Promise((resolve, reject) => {
                    this.conn.query(sql, params)
                        .then((result) => {
                            resolve(result);
                        }).catch((error) => {
                            console.error(error);
                            reject(error);
                        });
                });
            }
        }).alias(key);
    }
    public select() {
        return createSqlToken({
            ...this.tableConfig,
            tablePrefix: this.conn.config.prefix,
            tableName: this.tableName,
            query: (sql, params) => {
                return new Promise((resolve, reject) => {
                    this.conn.query(sql, params)
                        .then((result) => {
                            resolve(result);
                        }).catch((error) => {
                            console.error(error);
                            reject(error);
                        });
                });
            }
        }).select();
    }
    beginTransaction(): Promise<any> {
        return this.conn.beginTransaction();
    }
    commit(): Promise<any> {
        return this.conn.commit();
    }
    rollback(): Promise<any> {
        return this.conn.rollback();
    }
    protected getTableName() {
        const prefix = this.conn.config?.prefix;
        const tableName = prefix ? `${prefix}${this.tableName}` : this.tableName;
        return this.tableAlias ? `${tableName} ${this.tableAlias}` : tableName;
    }
}
