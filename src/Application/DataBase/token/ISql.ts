import { IDataTableConfig } from "../Config";

export declare namespace DataBaseSql {
    interface ICreateSqlToken {
        type: 'alias'|'field'|'where'|'limit'|'join';
        value: string;
    }

    interface ICreateAliasOptions {
        tableName: string;
        key: string;
        tablePrefix?: string;
    }

    abstract class DataModelTokenPlugin {
        abstract alias(options: ICreateAliasOptions): string;
    }

    interface ICreateTokenConfig extends IDataTableConfig{
        tablePrefix?: string;
        tableName: string;
        tokenPlugin?: DataModelTokenPlugin;
        tokenList: Array<ICreateSqlToken>;
        valueList: Array<string|number>;
        query: (sql: string, params: any[]) => Promise<any>;
    }

    interface ICreateAliasOptionsEx extends ICreateAliasOptions {
        tokenPlugin?: DataModelTokenPlugin
    }

    interface ICreateWhereOptions extends ICreateTokenConfig  {
        tokenList: Array<ICreateSqlToken>;
        valueList: Array<string|number>;
        alias?: string;
    }
    // --- where
    interface IWhereCondition {
        logic: "IN"|"LIKE",
        value: Array<string|number>;
        field: string;
        like?: string;
    }
    type TWhereConditions = string|Array<string|IWhereCondition|Record<string, string|number>>; // 条件集合
    type TWhereLogic = 'OR'|'AND';

    interface ICreateFieldsOptions extends ICreateTokenConfig {
        alias?: string;
    }
    type IJoinType = 'LEFT'|'RIGHT'|'INNER';
    // join
    interface IJoinOptions {
        table: string;
        on: string;
        type: IJoinType;
    }
}
