import { TypePluginType, TypePluginRegisterProviders } from "./ABasePlugin";
import StoreMemory from "../core/GlobalStore";
import { CrossSitePlugin } from "./CrossSitePlugin";
import { MysqlPlugin } from "./MysqlPlugin";
import { DataModelPlugin } from "./DataModelPlugin";
import { getLogger } from "../logs";
import { queueCallFunc, utils } from "elmer-common";

type TypeExecPluginType<T = unknown> = T | TypePluginType;

const CorePlugin = [
    CrossSitePlugin,
    MysqlPlugin,
    DataModelPlugin
];

const pluginState:any = {};


export const pluginExec = function<K extends keyof TypePluginRegisterProviders<T>, T={}>(pluginTypes: TypePluginType[], provider: K, methodName: keyof TypePluginRegisterProviders<T>[K], ...args: any[]): Promise<any> {
    const logger = getLogger();
    return new Promise<T>((resolve, reject) => {
        const plugins = StoreMemory.getPlugins() || [];
        const AllPlugins = [
            ...CorePlugin,
            ...plugins
        ];
        const calledPool = [];
        logger.debug("开始执行插件：", pluginTypes, "方法：", methodName);
        queueCallFunc(AllPlugins as any[], (opt, Plug: new(...args: any[]) => any): any => {
            return new Promise((_resolve, _reject) => {
                if(!opt.lastResult?.finalResult) {
                    // 指定插件没有自定为最终结果将执行下一个插件方法
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
                                const pluginEvent = {
                                    returnValue: null,
                                    finalResult: false,
                                    ...opt
                                };
                                calledPool.push(pluginId);
                                const pluginResult = pluginObj.exec(provider, methodName, pluginEvent, ...args);
                                if(!utils.isPromise(pluginResult)) {
                                    _resolve({
                                        finalResult: pluginEvent.finalResult,
                                        data: pluginResult
                                    });
                                } else {
                                    pluginResult.then((data) => {
                                        _resolve({
                                            finalResult: pluginEvent.finalResult,
                                            data: data
                                        });
                                    }).catch((err) => {
                                        logger.error(err);
                                        _reject(err);
                                    });
                                }
                                return null;
                            }
                        }
                    }
                    _resolve({
                        finalResult: false,
                        data: null
                    });
                } else {
                    _resolve(opt.lastResult);
                }
            });
        }, {
            throwException: true,
            paramConvert: (PluginFactory: new(...args: any[]) => any) => {
                if(typeof PluginFactory === "function") {
                    const initId = "plugin_init_" + utils.guid();
                    return {
                        id: initId,
                        params: PluginFactory
                    };
                } else {
                    return PluginFactory;
                }
            },
            onBefore: (checkParams: any[]) => {
                checkParams.push({
                    id: "finishResult",
                    params: {},
                    fn: (opt:any) => opt.lastResult?.data
                });
            }
        }).then((data) => {
            logger.debug("执行插件    ：", pluginTypes, "方法：", methodName, "结果：", data.finishResult);
            resolve(data.finishResult);
        }).catch((err) => {
            logger.error("执行插件    ：", pluginTypes, "方法：", methodName, "失败", err);
            reject(err.exception);
        });
    });
};

export const pluginDestory = <T=unknown>(pluginType: TypeExecPluginType<T>, ...args: any[]): void => {
    const plugins = pluginState[pluginType];
    if(plugins) {
        for(const obj of Object.values(plugins)) {
            typeof (obj as any).destory === "function" && (obj as any).destory(...args);
        }
        delete pluginState[pluginType];
    }
};
/**
 * 初始化特定插件
 * @param pluginTypes 
 */
export const pluginInit = <T=unknown>(pluginTypes: TypeExecPluginType<T>[]) => {
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
