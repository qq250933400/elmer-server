import {
    RequestMapping,
    Controller,
    AddInterceptors,
    GetRequest
} from "../core";
import { GetConfig, GetServerConfig } from "../config";
import { IConfigServer } from "../config/IConfigServer";
import { Autowired } from "elmer-common";
import { Request } from "express";
import { StaticFiles } from "../core/StaticFiles";
import * as fs from "fs";
import * as path from "path";
import utils from "../core/utils";

@Controller("upload")
export class Upload {

    @GetServerConfig
    config: IConfigServer;

    @Autowired()
    fileObj: StaticFiles;

    @AddInterceptors
    beforeUploadAuth() {
        if(!fs.existsSync(this.config.temp) || !fs.lstatSync(this.config.temp).isDirectory()) {
            return {
                statusCode: "UF_504",
                message: "服务器内部程序错误"
            };
        }
        if(!fs.existsSync(this.config.uploadPath) || !fs.lstatSync(this.config.uploadPath).isDirectory()) {
            console.log(this.config);
            return {
                statusCode: "UF_505",
                message: "服务器内部程序错误"
            };
        }
    }

    @RequestMapping("/file", "POST")
    async uploadFile(
        @GetRequest body: Request
    ) {
        console.log(this.fileObj.readUploadInfo(body));
        return this.fileObj.readUploadFile(body, (action) => {
            console.log(action);
        });
    }
}