import { IDataTableConfig } from "./Config";
import { createInstance } from "../../Annotation";
import { Connection } from "./Connection";

export const TableSymbol = Symbol("DataBaseTable");

export const TableConfigSymbol = Symbol("DataBaseTableConfig");

// @AppModel(Connection)
export class DataModel {
    static readonly [TableConfigSymbol]: Symbol = TableSymbol;
    static readonly tableName: string;
    static readonly tableConfig: IDataTableConfig;
    
    private conn: Connection;

    constructor(opt: any) {
        const instanceId = opt.instanceId;
        const requestId = opt.requestId;
        this.conn = createInstance(Connection, {
            instanceId,
            requestId
        });
        this.conn.init();
    }
    public where() {
        console.log("where", this.conn.startTransaction());
    }
}
