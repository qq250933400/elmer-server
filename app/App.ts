
import { BootApplication, AppService, Config, GetConfig, AppModel } from "../src";
import { Param } from "../src/Annotation/module";

import "./router";

@AppService
class TestService {
    say() {
        console.log("hello world");
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
    private main() {
        console.log("Run main: ", this.config);
        console.log(this.testService.say(), this.config);
    }
}

