import { IConfigDB } from "../../Config/interface/IConfigDB";
import { createInstance } from "../../Annotation/createInstance";
import { UtilsService } from "../../Module/UtilsService";
import { Log } from "../Core/Log";
import utils from "../../utils/utils";

export abstract class DataBaseEngine {
    public config!: IConfigDB;
    public utils: UtilsService;
    public log: Log;

    abstract dispose(): void;
    abstract loadConnection(): void;
    abstract connect(): Promise<any>;

    constructor(opt: any) {
        this.utils = createInstance(UtilsService, opt);
        this.log = createInstance(Log, opt);
    }
    init(config: IConfigDB) {
        if(utils.isEmpty(config?.host) || utils.isEmpty(config?.password)) {
            throw new Error("Database config error");
        }
        this.config = config;
        this.config.password = this.utils.config.publicKey ? this.utils.aseDecode(config.password) : config.password;
        this.loadConnection();
    }
    error(message: string, ...args: any): void {
        this.log.error(message, ...args);
    }
};
