import { DataBaseSql } from "./ISql";
import utils from "../../../utils/utils";
export const join = (config: DataBaseSql.ICreateTokenConfig, option: DataBaseSql.IJoinOptions) => {
    const tablePrefix = !utils.isEmpty(config.tablePrefix) ? `${config.tablePrefix}` : "";
    const tableName = tablePrefix + option.table;
    config.tokenList.push({
        type: "join",
        value: `${option.type} JOIN ${tableName} ON ${option.on}`
    });
};