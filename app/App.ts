import "reflect-metadata";
import "./router";
import { BootApplication, Config, utils } from "../src";
import { UsePlugins, ABasePlugin, TypePluginType } from "../src/plugin";
import { Autowired } from "elmer-common";

class AdminRequestPlugin extends ABasePlugin {
    init(): void {
        this.register("RequestPlugin", {
            beforSend: (lastData, data) => {
                console.log("AdminRequestPlugin", data);
                lastData.returnValue = data;
                if(data?.statusCode === 200) {
                    return data;
                } else {
                    return {
                        statusCode: 200,
                        message: "Success",
                        data
                    };
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
@Config("./app/corssSite.json", "Security")
@BootApplication
export class App {
    main(): void {
        console.log("----Need run Application");
    }
}
