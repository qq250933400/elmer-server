import utils from "../../utils/utils";
import { IDataTableConfig } from "./Config";


interface ICreateSqlToken {
    type: 'alias'|'field'|'where';
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
    tokenPlugin?: DataModelTokenPlugin
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
export type TWhereConditions = string|Array<string|IWhereCondition|Record<string, string|number>>; // 条件集合
export type TWhereLogic = 'OR'|'AND';
/**
 * 创建数据表别名
 * @param param0 - 参数
 * @returns 
 */
const alias = ({ tableName, key, tablePrefix, tokenPlugin }: ICreateAliasOptionsEx) => {
    let value: string;
    if(typeof tokenPlugin?.alias === "function") {
        value = tokenPlugin.alias({
            tableName,
            key,
            tablePrefix,
        });
    } else {
        value = tablePrefix ? `${tablePrefix}${tableName}` : tableName;
        value = `${value} ${key}`;
    }
    return {
        type: 'alias',
        value
    };
};

const where = (config: ICreateWhereOptions, condition: TWhereConditions, whereLogic: TWhereLogic = 'AND') => {
    let whereValue: string[] = [];
    const valueList: Array<string|number> = [];
    const fieldPrefix = !utils.isEmpty(config.alias) ? `${config.alias}.` : "";
    if(utils.isString(condition)) {
        whereValue.push(condition);
    } else if(utils.isArray(condition)) {
        condition.forEach(item => {
            if(utils.isString(item)) {
                whereValue.push(item);
            } else if(utils.isObject(item)) {
                if(utils.isEmpty(item.logic)) {
                    Object.keys(item).forEach((fieldName: string) => {
                        const fieldNameValue = !fieldName.startsWith(fieldPrefix) ? `${fieldPrefix}${fieldName}` : fieldName;
                        whereValue.push(`${fieldNameValue}=?`);
                        valueList.push(item[fieldName]);
                    });
                } else {
                    const fieldName = item.field.toString();
                    const fieldNameValue = !fieldName.startsWith(fieldPrefix) ? `${fieldPrefix}${fieldName}` : fieldName;
                    const itemLogic = item.logic.toString().toUpperCase();
                    if(itemLogic === "IN") {
                        const inValue = '?'.repeat((item.value as string[]).length).split("").join(",");
                        whereValue.push(`${fieldNameValue} IN(${inValue})`);
                        valueList.push(...(item.value as string[]));
                    } else if(itemLogic === "LIKE") {
                        // 建议匹配值以values字段传入，防止前端注入风险
                        if(utils.isEmpty(item.like)) {
                            console.error(item);
                            throw new Error(`Sql Token Like Condition Error， the like attribute is empty.`);
                        }
                        whereValue.push(`${fieldNameValue} LIKE '${item.like}'`);
                        !utils.isEmpty(item.value) && valueList.push(item.value.toString());
                    }
                }
            }
        })
    }
    config.tokenList.push({
        type: "where",
        value: whereValue.join(` ${whereLogic} `),
    });
    config.valueList.push(...valueList);

    return {
        select: () => select(config.tokenList, config),
        update: () => update(config.tokenList, config),
        delete: () => deleteExec(config.tokenList, config),
    };
}

const createExec = (execCmd: 'SELECT'|'UPDATE'|'DELETE',tokenList: ICreateSqlToken[], { tablePrefix, tableName }: ICreateTokenConfig) => {
    const sqlList: string[] = [execCmd];
    const fieldsTokenList = tokenList.filter(item => item.type === 'field');
    let hasAlias = false;
    if(fieldsTokenList.length > 0) {
        //
        console.log("---CreateFieldsSql---");
    } else {
        sqlList.push('*');
    }
    tokenList.forEach((item, index) => {
        if(index === 0) {
            sqlList.push("FROM");
            if(item.type === 'alias') {
                if(item.type === 'alias') {
                    sqlList.push(item.value);
                } else {
                    const fromTable = tablePrefix ? `${tablePrefix}${tableName}` : tableName;
                    sqlList.push(fromTable);
                }
            } else if(item.type === "where") {
                sqlList.push(item.value);
            }
        } else {
            if(item.type === "where") {
                sqlList.push(`where ${item.value}`);
            }
        }
    });
    console.log("---FinalSql:--", tokenList,sqlList.join(" "));
};
const select = (tokenList: ICreateSqlToken[], config: ICreateTokenConfig) => {
    return createExec("SELECT", tokenList, config);
};
const update = (tokenList: ICreateSqlToken[], config: ICreateTokenConfig) => {
    return createExec("UPDATE", tokenList, config);
};
const deleteExec = (tokenList: ICreateSqlToken[], config: ICreateTokenConfig) => {
    return createExec("DELETE", tokenList, config);
};
export const createSqlToken = (config: ICreateTokenConfig) => {
    const tokenList: any[] = [];
    const valueList: any[] = [];
    return {
        alias: (key: string) => {
            tokenList.push(alias({
                ...config,
                key,
            }));
            return {
                select: () => select(tokenList, config),
                where: (condition: TWhereConditions, logic: TWhereLogic = 'AND') => where({
                    ...config,
                    tokenList,
                    alias: key,
                    valueList
                }, condition, logic)
            };
        }
    }
};
