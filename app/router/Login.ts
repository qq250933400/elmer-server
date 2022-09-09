import {
    Controller,
    RequestMapping,
    DataModel,
    QueryParam,
    RequestCookie,
    DefineDataModel,
    GetDataModel,
    GetServerConfig,
    IConfigServer,
    StaticFiles
} from "../../src";
import { Autowired, queueCallFunc, utils } from "elmer-common";
import { GetResponse, RequestHeader } from "../../src/core";
import { Request, Response } from "express";
import * as path from "path";
import * as fs from "fs";

@DefineDataModel({
    source: "doc.mysql"
})
class LoginModel extends DataModel {
    @GetServerConfig
    sevConfig!: IConfigServer;
    @Autowired()
    fileObj!: StaticFiles;
    dataSource() {
        return new Promise((resolve, reject) => {
            const rootPath = path.resolve(process.cwd(), this.sevConfig.temp);
            const filePath = path.resolve(rootPath, "./doc");
            const fileName = path.resolve(filePath, "database.md");
            const mdText: string[] = [];
            this.fileObj.checkDir(rootPath,  process.cwd());
            this.fileObj.checkDir(filePath,  rootPath);
            queueCallFunc([
                {
                    id: "tables",
                    fn: () => {
                        return this.query("showAllTables", {});
                    }
                }, {
                    id: "columns",
                    fn: (opt) => {
                        const tables = opt.lastResult || [];
                        const vParams:any[] = [];
                        for(const table of tables) {
                            const name = table["TABLE_NAME"], comment = table["TABLE_COMMENT"];
                            vParams.push({
                                id: name,
                                params: {
                                    name,
                                    comment
                                }
                            });
                        }
                        
                        return queueCallFunc(vParams, (opt, param): any => {
                            return new Promise((_resolve, _reject) => {
                                mdText.push(`# DataTable: ${param.name}`);
                                if(!utils.isEmpty(param.comment)) {
                                    mdText.push(param.comment);
                                }
                                this.query("selectTableStructure", { name: param.name })
                                    .then((optData) => {
                                        mdText.push(`|字段名|类型|注释|`);
                                        mdText.push("|:-----|:-----|:-----|")
                                        for(const row of optData) {
                                            mdText.push(`|${row['COLUMN_NAME']}|${row['COLUMN_TYPE']}|${row['COLUMN_COMMENT']}|`);
                                        }
                                        mdText.push("--- ");
                                        _resolve([]);
                                    }).catch(_reject);
                            });
                        });
                    }
                }
            ], undefined, {
                throwException: true
            }).then((resp) => {
                fs.writeFileSync(fileName, mdText.join("\n"), { "encoding": "utf-8" });
                resolve(resp.columns);
            }).catch(reject);
             
        });
    }
    getNews() {
        
    }
}

@Controller("login")
export class Login {

    @Autowired()
    files: StaticFiles;

    @RequestMapping("/config", "GET")
    async config(
        @QueryParam page: number,
        @RequestCookie token: string,
        @RequestHeader header: any
    ):Promise<any> {
        console.log(page);
        console.log(token);
        console.log(header);
        return {};
    }

    @RequestMapping("/test", "GET")
    test(@QueryParam str: any, @GetResponse res: Response) {
        console.log(str);
        res.cookie("token", "1230099", {
            maxAge: 10000
        });
        return this.files.readJson("./test.json");
    }
    @RequestMapping("/md","GET")
    dbMarkdown(@GetDataModel(LoginModel) login: LoginModel):Promise<any> {
        return login.dataSource();
    }
}
