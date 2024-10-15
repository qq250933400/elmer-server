import { AppService } from "../../Annotation";
import { createInstanceInApp } from "../../Annotation/createInstance";
import { GetConfig } from "../../Config/GetConfig";
import { IConfigDB } from "../../Config/interface/IConfigDB";
import { DataBaseEngine } from "./DataBaseEngine";
import { Mysql } from "./Mysql";

@AppService
export class Connection {

    private db: DataBaseEngine;

    @GetConfig("DataBase")
    public config!: IConfigDB;

    init() {
        const dataBaseEngine = this.config.type || "Mysql";
        if(dataBaseEngine === "Mysql") {
            this.db = createInstanceInApp(Mysql, this);
        } else {
            throw new Error(`Unsupport data engine type.(${dataBaseEngine})`);
        }
        this.db.init(this.config);
    }
    startTransaction() {
        this.db.connect();
    }
}