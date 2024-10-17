
import { BootApplication, AppService, Config, GetConfig, AppModel, JsonToType } from "../src/index";

import "./router";

@AppService
class TestService {
    say() {
        console.log("app say: hello world");
    }
}

@Config("./config.yml")
@Config("./email.yml")
@Config("./corssSite.json")
@AppModel(TestService, JsonToType)
@BootApplication
export class App {
    @GetConfig("Server", "port")
    private config!: number;
    constructor(
        private  testService: TestService,
        private jsonToType: JsonToType
    ) {
        // console.log("-----Init--App-", this.testService, this.config);
    }
    main() {
        this.jsonToType.toType({
            catalog: 'def',
            db: 'trademark',
            table: 'msj_options',
            orgTable: 'msj_options',
            name: 'id',
            orgName: 'id',
            charsetNr: 63,
            length: 11,
            type: 3,
            flags: 16899,
            decimals: 0,
            zeroFill: false,
            protocol41: true,
            details: {
                name: "id",
                type: "int",
                length: 11,
                unsigned: true,
                autoIncrement: true
            },
            data: [ {label: "Hello", value: "Name"}]
        }, "MysqlField");
        console.log('boot application', this.config);
    }
}

