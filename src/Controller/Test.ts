import { RequestMapping, Controller, RequestBody } from "../core";
import { Autowired } from "elmer-common";
import utils from "../utils/utils";
import { StaticFiles } from "../utils/StaticFiles";
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
    @RequestMapping("/encrype", "POST")
    encrypt(@RequestBody body: any) {
        if(!utils.isEmpty(body.text)) {
            return {
                statusCode: 200,
                responseBody: utils.aseEncode(body.text)
            };
        } else {
            return {
                statusCode: 500,
                message: "No encode text found"
            };
        }
    }
}