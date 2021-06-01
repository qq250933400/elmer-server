import "reflect-metadata";
import StoreMemory, { DECORATOR_MODEL_TYPE } from "../core/GlobalStore";
import DefineDecorator from "../core/DefineDecorator";

export const UsePlugins = (plugins: (new(...args: any[]) => any)[]) => {
    return (target: new(...args: any[]) => any) => {
        DefineDecorator(() => {
            const modelType = Reflect.getMetadata(DECORATOR_MODEL_TYPE, target);
            if(modelType === "BootApplication") {
                for(const plugin of plugins) {
                    if((plugin as any).uuid !== "0b57a8d9-b1ed-1b29-d87f-6e494c5e") {
                        throw new Error("引用插件必须继承基类ABasePlugin");
                    }
                }
                StoreMemory.setPlugins(plugins);
            } else {
                throw new Error("UsePlugins装饰器必须在启动类上使用。");
            }
        }, target, "Class");
    }
}
