
import { BootApplication, AppService, Config, GetConfig, AppModel } from "../src/index";

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
@AppModel(TestService)
@BootApplication
export class App {
    @GetConfig("Server", "port")
    private config!: number;
    constructor(
        private  testService: TestService
    ) {
        // console.log("-----Init--App-", this.testService, this.config);
    }
    main() {
        this.testService.say();
        console.log('boot application', this.config);
    }
}

