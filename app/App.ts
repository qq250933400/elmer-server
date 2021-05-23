import { BootApplication, Config, Autowired } from "../src";
import { TestService } from "./TestService";
import "./router";

@Config("./app/config.yml")
@BootApplication
export class App {
    @Autowired(TestService)
    private service: TestService;
    main(): void {
        this.service.run({} as any, '1.0.0');
        console.log("----Need run Application");
    }
}
