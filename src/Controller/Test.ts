import { RequestMapping, Controller } from "../core";
import { Autowired } from "elmer-common";
import utils from "../core/utils";
import { StaticFiles } from "../core/StaticFiles";
import * as path from "path";

@Controller("test")
export class TestController {
    @Autowired()
    private files: StaticFiles;
    @RequestMapping("/status", "GET")
    status() {
        const fileName = path.resolve(process.cwd(), "./package.json");
        const packageData = this.files.readJson(fileName, true);
        if(packageData) {
            return {
                name: packageData.name,
                version: packageData.version
            }
        } else {
            throw new Error("Not found information");
        }
    }
    @RequestMapping("/uuid", "GET")
    uuid() {
        return utils.guid();
    }
}