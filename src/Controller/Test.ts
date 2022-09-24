import { RequestMapping, Controller } from "./decorators";
import { GetSessionId } from "./Request";
import utils from "../utils/utils";
import { StaticFiles } from "../utils/StaticFiles";
import { QueryParam } from "./Request";
import { Session } from "../session";
import * as path from "path";

@Controller("test")
export class TestController {
    constructor(
        private files: StaticFiles,
        private session: Session
    ) {}
    @RequestMapping("/status", "GET")
    status(@GetSessionId ssid: string) {
        const fileName = path.resolve(process.cwd(), "./package.json");
        const packageData = this.files.readJson(fileName, true);
        console.log("mySession:", this.session.getItem("user"));
        this.session.setItem("user", "elmer_" + Date.now());
        if(packageData) {
            return {
                name: packageData.name,
                version: packageData.version
            };
        } else {
            throw new Error("Not found information");
        }
    }
    @RequestMapping("/uuid", "GET")
    uuid(@QueryParam("id") uid: string) {
        return utils.guid();
    }
    @RequestMapping("/randmon")
    getRandmonText(@QueryParam("length") len: number) {
        const lenValue = utils.isNumeric(len) ? len : 6;
        return utils.getRandomText(lenValue);
    }
}

