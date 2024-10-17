import utils from "../../utils/utils";
import { DataBaseSql } from "./token/ISql";
import { join } from "./token/Join";
/**
 * 创建数据表别名
 * @param param0 - 参数
 * @returns 
 */
const alias = ({ tableName, key, tablePrefix, tokenPlugin }: DataBaseSql.ICreateAliasOptionsEx) => {
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
const limit = (config: DataBaseSql.ICreateTokenConfig, start: number, end: number) => {
    if(typeof config.tokenPlugin?.["limit"] === "function") {
        config.tokenList.push({
            type: "limit",
            value: config.tokenPlugin["limit"](start, end)
        });
    } else {
        config.tokenList.push({
            type: "limit",
            value: `LIMIT ${start},${end}`
        });
    }
    return {
        select: () => select(config.tokenList, config),
        update: () => update(config.tokenList, config),
        delete: () => deleteExec(config.tokenList, config),
    }
};
const field = (config: DataBaseSql.ICreateFieldsOptions, fieldConfig: string[]|string) => {
    const aliasPrefix = !utils.isEmpty(config.alias) ? `${config.alias}.` : "";
    const fieldValues: string[] = [];
    if(utils.isArray(fieldConfig)) {
        fieldConfig.forEach((name) => {
            fieldValues.push(`${aliasPrefix}${name}`);
        });
    } else {
        fieldValues.push(fieldConfig?.toString());
    }
    config.tokenList.push({
        type: "field",
        value: fieldValues.join(','),
    });
    return {
        limit: (start: number, end: number) => limit(config, start, end),
        select: () => select(config.tokenList, config),
        update: () => update(config.tokenList, config),
        delete: () => deleteExec(config.tokenList, config),
    };
};
const where = (config: DataBaseSql.ICreateWhereOptions, condition: DataBaseSql.TWhereConditions, whereLogic: DataBaseSql.TWhereLogic = 'AND') => {
    const whereValue: string[] = [];
    const valueList: Array<string|number> = [];
    const fieldPrefix = !utils.isEmpty(config.alias) ? `${config.alias}.` : "";
    const prefixReg = /^[a-z]+\./i;
    if(utils.isString(condition)) {
        whereValue.push(condition);
    } else if(utils.isArray(condition)) {
        condition.forEach(item => {
            if(utils.isString(item)) {
                whereValue.push(item);
            } else if(utils.isObject(item)) {

                if(utils.isEmpty(item.logic)) {
                    Object.keys(item).forEach((fieldName: string) => {
                        const fieldNameValue = !prefixReg.test(fieldName) ? `${fieldPrefix}${fieldName}` : fieldName;
                        whereValue.push(`${fieldNameValue}=?`);
                        valueList.push(item[fieldName]);
                    });
                } else {
                    const fieldName = item.field.toString();
                    const fieldNameValue = !prefixReg.test(fieldName) ? `${fieldPrefix}${fieldName}` : fieldName;
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
        field: (fields: string[]|string) => field(config, fields),
        limit: (start: number, end: number) => limit(config, start, end),
        select: () => select(config.tokenList, config),
        update: () => update(config.tokenList, config),
        delete: () => deleteExec(config.tokenList, config),
    };
}

const createExec = (
    execCmd: 'SELECT'|'UPDATE'|'DELETE',
    tokenList: DataBaseSql.ICreateSqlToken[],
    { tablePrefix, tableName, valueList, query}: DataBaseSql.ICreateTokenConfig
) => {
    const sqlList: string[] = [execCmd];
    const fieldsTokenList = tokenList.filter(item => item.type === 'field');
    const fromTable = tablePrefix ? `${tablePrefix}${tableName}` : tableName;

    if(fieldsTokenList.length > 0) {
        sqlList.push(fieldsTokenList.map(item => item.value).join(","));
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
                    sqlList.push(fromTable);
                }
            } else if(item.type === "where") {
                sqlList.push(fromTable);
                sqlList.push("WHERE");
                sqlList.push(item.value);
            }
        } else {
            if(item.type === "where") {
                sqlList.push(`WHERE ${item.value}`);
            } else if(item.type === "limit") {
                sqlList.push(item.value);
            } else if(item.type === "join") {
                sqlList.push(item.value);
            }
        }
    });
    const querySql = sqlList.join(" ");
    return query(querySql, valueList);
};
const select = (tokenList: DataBaseSql.ICreateSqlToken[], config: DataBaseSql.ICreateTokenConfig) => {
    return createExec("SELECT", tokenList, config);
};
const update = (tokenList: DataBaseSql.ICreateSqlToken[], config: DataBaseSql.ICreateTokenConfig) => {
    return createExec("UPDATE", tokenList, config);
};
const deleteExec = (tokenList: DataBaseSql.ICreateSqlToken[], config: DataBaseSql.ICreateTokenConfig) => {
    return createExec("DELETE", tokenList, config);
};
export const createSqlToken = (config: Omit<DataBaseSql.ICreateTokenConfig, "tokenList"|"valueList">) => {
    const tokenList: any[] = [];
    const valueList: any[] = [];
    const topSqlConfig = {
        ...config,
        tokenList,
        valueList,
    };
    return {
        alias: (key: string) => {
            const sqlConfig = {
                ...topSqlConfig,
                alias: key
            };
            tokenList.push(alias({
                ...config,
                key,
            }));
            return {
                select: () => select(tokenList, sqlConfig),
                update: () => update(tokenList, sqlConfig),
                delete: () => deleteExec(tokenList, sqlConfig),
                where: (condition: DataBaseSql.TWhereConditions, logic: DataBaseSql.TWhereLogic = 'AND') => where(sqlConfig, condition, logic),
                field: (fields: string[]|string) => field(sqlConfig, fields),
                limit: (start: number, end: number) => limit(sqlConfig, start, end),
                join: (tableName: string, on: string, joinType: DataBaseSql.IJoinType = "LEFT") => {
                    join(sqlConfig, {
                        table: tableName,
                        type: joinType,
                        on
                    });
                    return {
                        where: (condition: DataBaseSql.TWhereConditions, logic: DataBaseSql.TWhereLogic = 'AND') => where(sqlConfig, condition, logic),
                        field: (fields: string[]|string) => field(sqlConfig, fields),
                        limit: (start: number, end: number) => limit(sqlConfig, start, end),
                        select: () => select(tokenList, sqlConfig),
                        update: () => update(tokenList, sqlConfig),
                        delete: () => deleteExec(tokenList, sqlConfig),
                    }
                }
            };
        },
        select: () => select(tokenList, topSqlConfig),
        where: (condition: DataBaseSql.TWhereConditions, logic: DataBaseSql.TWhereLogic = 'AND') => where(topSqlConfig, condition, logic),
        field: (fields: string[]|string) => field(topSqlConfig, fields),
        limit: (start: number, end: number) => limit(topSqlConfig, start, end),
        update: () => update(tokenList, topSqlConfig),
    }
};
