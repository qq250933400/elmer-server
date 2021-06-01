import { TypePluginType, TypePluginProvider } from "./ABasePlugin";
import StoreMemory from "../core/GlobalStore";
import { CrossSitePlugin } from "./CrossSitePlugin";

const pluginState = {};

export const pluginExec = function<T={}>(pluginTypes: TypePluginType[], provider: TypePluginProvider, methodName: keyof T, ...args: any[]): void {
    const plugins = StoreMemory.getPlugins() || [];
    const AllPlugins = [
        CrossSitePlugin,
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
            pluginObj.exec(provider, methodName, ...args);
        }
    });
};

export const pluginDestory = (pluginType: TypePluginType): void => {
    const plugins = pluginState[pluginType];
    if(plugins) {
        for(const obj of Object.values(plugins)) {
            typeof (obj as any).destory === "function" && (obj as any).destory();
        }
        delete pluginState[pluginType];
    }
}
