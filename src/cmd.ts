#!/usr/bin/env node
import CommandHelper from "elmer-common/lib/CommandHelper";
import { Schema } from "./core/Schema";
import { ConfigTemplate } from "./module/ConfigTemplate";

new CommandHelper(process.argv)
    .author("Elmer S J Mo")
    .command("init", "初始化项目，生成配置文件模板", () => {
        (new ConfigTemplate(new Schema())).init();
    })
    .run();