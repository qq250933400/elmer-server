import { IDataTableConfig } from "./Config";

export const TableSymbol = Symbol("DataBaseTable");

export const TableConfigSymbol = Symbol("DataBaseTableConfig");

export class TableBase {
    static readonly [TableConfigSymbol]: Symbol = TableSymbol;
    static readonly tableName: string;
    static readonly tableConfig: IDataTableConfig;
    public where() {
        console.log("where");
    }
}
