import "reflect-metadata";
import "./router";
import { BootApplication, Config, Interceptor } from "../src";

@Config("./app/config.yml")
@Config("./app/corssSite.json", "Security")
@BootApplication
export class App {
    @Interceptor()
    private testApp() {
        console.log(arguments);
    }
}
