#!/usr/bin/env node
import CommandHelper from "elmer-common/lib/CommandHelper";
import { Schema } from "./bak/core/Schema";
import { ConfigTemplate } from "./bak/module/ConfigTemplate";

new CommandHelper(process.argv)
    .author("Elmer S J Mo")
    .description("env=DEV", "在启动服务的命令加上env=DEV参数可区分运行环境，并加载对应环境配置文件")
    .command("init", "初始化项目，生成配置文件模板", () => {
        (new ConfigTemplate(new Schema())).init();
    })
    .command("build", "编译代码(默认使用Webpack编译代码)，开发中。。。", () => {
        
    })
    .run();