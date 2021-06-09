import { TypePluginType, TypePluginProvider } from "./ABasePlugin";
import StoreMemory from "../core/GlobalStore";
import { CrossSitePlugin } from "./CrossSitePlugin";
import { MysqlPlugin } from "./MysqlPlugin";
import { getLogger } from "../logs";

const CorePlugin = [
    CrossSitePlugin,
    MysqlPlugin
];

const pluginState = {};

export const pluginExec = function<T={}>(pluginTypes: TypePluginType[], provider: TypePluginProvider, methodName: keyof T, ...args: any[]): any {
    const plugins = StoreMemory.getPlugins() || [];
    const AllPlugins = [
        ...CorePlugin,
        ...plugins
    ];
    const pluginEvent = {
        returnValue: null
    };
    const calledPool = [];
    let pluginResult = null;
    AllPlugins.map((Plug: any) => {
        const pType = Plug.prototype.getType();
        if(pluginTypes.indexOf(pType)>=0) {
            const pluginId = Plug.prototype.getId();
            if(calledPool.indexOf(pluginId) < 0) {
                // 未被调用过的Plugin才可以被调用
                let pluginObj = pluginState[pType] ? pluginState[pType][pluginId] : null;
                if(!pluginObj) {
                    if(!pluginState[pType]) {
                        pluginState[pType] = {};
                    }
                    const params = StoreMemory.getClassParams(Plug) || [];
                    pluginObj = new Plug(...params);
                    pluginState[pType][pluginId] = pluginObj;
                    pluginObj.init();
                }
                if(pluginObj.hasProvider(provider)) {
                    // 只调用注册有当前指定Provider的Plugin
                    pluginResult = pluginObj.exec(provider, methodName, pluginEvent, ...args);
                    calledPool.push(pluginId);
                }
            }
        }
    });
    return pluginResult;
};

export const pluginDestory = (pluginType: TypePluginType): void => {
    const plugins = pluginState[pluginType];
    if(plugins) {
        for(const obj of Object.values(plugins)) {
            typeof (obj as any).destory === "function" && (obj as any).destory();
        }
        delete pluginState[pluginType];
    }
};
/**
 * 初始化特定插件
 * @param pluginTypes 
 */
export const pluginInit = (pluginTypes: TypePluginType[]) => {
    const plugins = StoreMemory.getPlugins() || [];
    const AllPlugins = [
        ...CorePlugin,
        ...plugins
    ];
    AllPlugins.map((Plug: any) => {
        const pType = Plug.prototype.getType();
        if(pluginTypes.indexOf(pType)>=0) {
            const pluginId = Plug.prototype.getId();
            let pluginObj = pluginState[pType] ? pluginState[pType][pluginId] : null;
            if(!pluginObj) {
                if(!pluginState[pType]) {
                    pluginState[pType] = {};
                }
                const params = StoreMemory.getClassParams(Plug) || [];
                pluginObj = new Plug(...params);
                pluginState[pType][pluginId] = pluginObj;
                pluginObj.init();
            }
        }
    });
}
