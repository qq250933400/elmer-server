import { defineModule } from "../../Annotation/module";
import { META_VALUE_MODULE_DATABASE } from "../../data/constants";
import { TableSymbol, TableConfigSymbol } from "./DataModel";
import utils from "../../utils/utils";

export interface IDataBaseSqlColumn {
    type: 'TINYINT'|'INT'|'BIGINT'|'TEXT'|'DATE'|'DATETIME'|'TIME'|'TIMESTAMP'|'FLOAT'|'DOUBLE'|`CHAR(${number})`|`VARCHAR(${number})`;
    length?: number;
    primaryKey?: boolean;
    autoIncrement?: boolean;
    default?: string|number;
    comment?: string;
}

export interface IDataTableConfig {
    columns: Record<string, Partial<IDataBaseSqlColumn>>;
}

export const DataBase = <IFactory extends new(...args: any[]) => any>(tableName: string, config: IDataTableConfig)=>(Factory: IFactory, context: ClassDecoratorContext<any>) => {
    
    const defineSymbol = Factory[TableConfigSymbol]?.toString();
    const tableSymbol = TableSymbol.toString();

    if(defineSymbol !== tableSymbol) {
        throw new Error(`Define that data modules must inherit the DataModel. (${context.name})`);
    }
    if(utils.isEmpty(tableName)) {
        throw new Error("The tableName is missing in DataBase decorator config.");
    }
    const defineDataModel = class extends Factory {
        readonly tableName: string = tableName;
        readonly tableConfig: IDataTableConfig = config;
        constructor(...args: any[]) {
            super(...args);
            Factory['tableName'] = tableName;
            Factory['tableConfig'] = config;
        }
    }
    return defineModule(defineDataModel, META_VALUE_MODULE_DATABASE, context);
};

