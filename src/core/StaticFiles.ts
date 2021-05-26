import { GetConfig } from "../config";
import { Service } from "./ClassDecorator";
import utils from "./utils";
import * as path from "path";
import * as fs from "fs";

@Service
export class StaticFiles {
    @GetConfig("staticPath")
    private path: string;
    private rootPath: string;
    constructor() {
        if(!utils.isEmpty(this.path)) {
            this.rootPath = path.resolve(process.cwd(), this.path);
        } else {
            this.rootPath = path.resolve(process.cwd(), "./static");
        }
    }
    readJson(fileName: string) {
        const localPath = path.resolve(this.rootPath, fileName);
        if(fs.existsSync(localPath)) {
            const txt = fs.readFileSync(localPath, "utf8");
            return JSON.parse(txt);
        } else {
            throw new Error("File not found");
        }
    }
}
