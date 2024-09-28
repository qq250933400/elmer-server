import "reflect-metadata";
/**
 * 定义模块类型
 */
export enum EnumFactoryModuleType {
    /** 应用程序级别，在一个应用程序内只有一个object对象 */
    AppService = 1,
    /** 请求级别，每次发起请求将会创建一个新的object对象，并在请求结束释放 */
    RequestService,
    /** 当超过一个应用程序在运行的时候全局只有一个object对象 */
    GlobalService
}

// export const config = createStateActions("config", {
    
// });