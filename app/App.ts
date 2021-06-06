import { BootApplication, Config, Autowired, utils } from "../src";
import { UsePlugins, ABasePlugin, TypePluginType } from "../src/plugin";
import { TestService } from "./TestService";
import "./router";

class AdminRequestPlugin extends ABasePlugin {
    init(): void {
        this.register("RequestPlugin", {
            beforSend: (lastData, data) => {
                console.log("AdminRequestPlugin", lastData, data);
                lastData.returnValue = data
                return {
                    statusCode: 200,
                    message: "Success",
                    data
                }
            }
        });
    }
    getId(): string {
        return utils.guid();
    }
    getType(): TypePluginType {
        return "Request";
    }
};

@Config("./app/config.yml")
@Config("./app/corssSite.json", "CrossSite")
@UsePlugins([
    AdminRequestPlugin
])
@BootApplication
export class App {
    @Autowired(TestService)
    private service: TestService;
    main(): void {
        this.service.run({} as any, '1.0.0');
        console.log("----Need run Application");
    }
}
