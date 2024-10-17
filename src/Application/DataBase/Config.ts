import { defineModule } from "../../Annotation/module";
import { META_VALUE_MODULE_DATABASE } from "../../data/constants";
import { TableSymbol, TableConfigSymbol } from "./DataModel";

export interface IDataTableField {

}

export interface IDataTableConfig {
    columns: Record<string, IDataTableField>;
}

export const DataBase = <IFactory extends new(...args: any[]) => any>(tableName: string, config: IDataTableConfig)=>(Factory: IFactory, context: ClassDecoratorContext<any>) => {
    
    const defineSymbol = Factory[TableConfigSymbol]?.toString();
    const tableSymbol = TableSymbol.toString();

    if(defineSymbol !== tableSymbol) {
        throw new Error(`Define that data modules must inherit the DataModel. (${context.name})`);
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

