
import { BootApplication, AppService, Config, GetConfig, AppModel } from "../src";
import { Param } from "../src/Annotation/module";

import "./router";

@AppService
class TestService {
    say() {
        console.log("app say: hello world");
    }
}

@Config("./config.yml")
@Config("./email.yml")
@AppModel(TestService)
@BootApplication
export class App {
    @GetConfig("Server", "port")
    private config: number;
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

