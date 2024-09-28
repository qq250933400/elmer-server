import "reflect-metadata";
import "./router";
import { BootApplication, Config, GetConfig, Interceptor, Controller, RequestMapping } from "../src";

@Controller("/")
class Test {
    @GetConfig("Server")
    private config: any;
    constructor() {
        console.log("---Config---", this.config);
    }
    @RequestMapping("/test")
    test() {
        console.log("this.config,", this.config);
    }
}

@Config("./app/config.yml")
@Config("./app/corssSite.json", "Security")
@BootApplication
export class App {
    @Interceptor()
    private testApp() {
        console.log(arguments);
    }
}
