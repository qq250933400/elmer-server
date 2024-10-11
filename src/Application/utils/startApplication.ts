import {
    META_KEY_MODULE_TYPE,
    META_KEY_INSTANCE_ID,
    META_VALUE_BOOT_APPLICATION
} from "../../data/constants";
import { GetConfig } from "../../Config";

console.log("----startApplication-config", GetConfig);
import { v7 as uuid } from "uuid";
import { createInstance } from "../../Annotation/createInstance";
import { ExpressAdapter } from "../Core/ExpressAdapter";
import { Application } from "../Core/Application";
import utils from "../../utils/utils";


export const startApplication = (Factory: new(...args: any[]) => void) => {
    const moduleType = Reflect.getMetadata(META_KEY_MODULE_TYPE, Factory);
    if(moduleType !== META_VALUE_BOOT_APPLICATION) {
        throw new Error("The target class must be marked with @BootApplication");
    }
    const instanceId = uuid();
    // Reflect.defineMetadata(META_KEY_INSTANCE_ID, instanceId, Factory);
    // create instance
    const Adaptuer = Factory['adapter'] || ExpressAdapter;
    const adapter = new Adaptuer();
    const app = createInstance(Factory, {
        instanceId
    });
    const appInstance = createInstance(Application, {
        instanceId
    }, app);
    // todo: 初始化配置以后才执行main方法，在初始化的时候并没有同步数据导致无法正确获取config数据
    appInstance.init(app); // 准备应用
    utils.invokeEx(app as any, "main", adapter.app); // 执行main方法，在运行前可自定义操作
    appInstance.start(adapter); // 运行服务监听
}
