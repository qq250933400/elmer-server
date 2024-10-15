import { IDataTableConfig } from "./Config";
import { createInstance } from "../../Annotation";
import { Connection } from "./Connection";
import { createSqlToken } from "./createSqlToken";
import utils from "../../utils/utils";

export const TableSymbol = Symbol("DataBaseTable");

export const TableConfigSymbol = Symbol("DataBaseTableConfig");

interface IWhereCondition {

}
type TWhereConditions = string|Array<string|IWhereCondition>; // 条件集合
type TWhereLogic = 'OR'|'AND';

interface IAliasResult {
    where(conditions: TWhereConditions): Promise<any>;
    select(): Promise<any>;
}

/**
 * 关系型数据库model, mysql, oracle
 */
export class DataModel {
    static readonly [TableConfigSymbol]: Symbol = TableSymbol;
    readonly tableName: string;
    readonly tableConfig: IDataTableConfig;
    
    private conn: Connection;
    private tableAlias: string;
    private whereConditions: TWhereConditions;
    private whereLogic: TWhereLogic;

    constructor(opt: any) {
        const instanceId = opt.instanceId;
        const requestId = opt.requestId;
        this.conn = createInstance(Connection, {
            instanceId,
            requestId
        });
        this.conn.init();
    }
    public where(conditions: TWhereConditions, logic: TWhereLogic = 'AND') {
        this.whereConditions = conditions;
        this.whereLogic = logic;
        // console.log("where", this.conn.startTransaction());
    }
    public alias(key: string) {
        this.tableAlias = key;
        return createSqlToken({
            ...this.tableConfig,
            tablePrefix: this.conn.config.prefix,
            tableName: this.tableName
        }).alias(key);
    }
    public select() {
        //console.log(this, this.getTableName());
    }
    protected getTableName() {
        const prefix = this.conn.config?.prefix;
        const tableName = prefix ? `${prefix}${this.tableName}` : this.tableName;
        return this.tableAlias ? `${tableName} ${this.tableAlias}` : tableName;
    }
    protected getConditions() {
        if(utils.isString(this.whereConditions)) {
            return this.whereConditions;
        } else if(utils.isArray(this.whereConditions)) {
            let whereStr = '';
            this.whereConditions.forEach(condition => {
                if(utils.isString(condition)) {
                    if(!utils.isEmpty(this.tableAlias)) {
                        if(condition.startsWith(`${this.tableAlias}.`)) {
                            whereStr += condition;
                        }
                    }
                } else {
                    
                }
            });
        }
    }
}
