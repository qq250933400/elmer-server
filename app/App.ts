
import { BootApplication, AppService, Config, GetConfig } from "../src";

@AppService
class TestService {
    say() {
        console.log("hello world");
    }
}

@Config("./config.yml")
@Config("./email.yml")
@BootApplication
export class App {
    @GetConfig("Server", "port")
    private config: any;
    constructor(
        private testService: TestService
    ) {
        console.log("-----Init--App-", this.testService);
    }
    private main() {
        console.log(this.testService.say(), this.config);
    }
}

