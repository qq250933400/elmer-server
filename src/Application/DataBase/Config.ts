import { defineModule } from "../../Annotation/module";
import { META_VALUE_MODULE_DATABASE } from "../../data/constants";
import { TableBase, TableSymbol, TableConfigSymbol } from "./TableBase";

export interface IDataTableField {

}

export interface IDataTableConfig {
    columns: Record<string, IDataTableField>;
}

export const DataBase = <IFactory extends new(...args: any[]) => any>(tableName: string, config: IDataTableConfig)=>(Factory: IFactory, context: ClassDecoratorContext<any>) => {
    
    const defineSymbol = Factory[TableConfigSymbol]?.toString();
    const tableSymbol = TableSymbol.toString();

    if(defineSymbol !== tableSymbol) {
        throw new Error(`Define that data modules must inherit the baseModel. (${context.name})`);
    }
    const defineDataModel = class extends Factory {
        static readonly tableName: string = tableName;
        static readonly tableConfig: IDataTableConfig = config;
    }
    return defineModule(defineDataModel, META_VALUE_MODULE_DATABASE, context);
};

@DataBase("users", {
    columns: {
        id: {
            type: "int",
            primary: true,
            autoIncrement: true,
        },
        name: {
            type: "string",
            length: 32,
        },
        age: {
            type: "int",
        },
        birthday: {
            type: "date",
        },
        createTime: {
            type: "datetime",
        },
        updateTime: {
            type: "datetime"
        }
    }
})
class TestTable extends TableBase  {
    log() {
        
    }
}

const tablet = new TestTable();

console.log("----TestTable--", tablet.where);