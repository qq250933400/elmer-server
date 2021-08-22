import { Service } from "elmer-common";
import utils from "../core/utils";

interface ISchemaValidate {
    (data: any): void;
    (data: any, schema: any): void;
    (data: any, schema: any, name: string): void;
    (data: any, name: string): void;
}

abstract class ASchema {
    abstract validate: ISchemaValidate;
}

@Service
export class Schema extends ASchema{
    private schemaConfig: any = {};
    private runSchema: any = {};
    validate:ISchemaValidate = (data: any, schema?: any, name?: string): void => {
        this.runSchema = {};
        if(utils.isObject(schema)) {
            // 验证指定数据schema
            this.doValidate(data, schema, name || "Unknow", []);
        } else if(utils.isString(schema)) {
            // 验证指定规则name
            this.doValidate(data, this.schemaConfig[schema as string] as any, schema as string, []);
        } else {
            const name = Object.keys(this.schemaConfig)[0];
            this.doValidate(data, this.schemaConfig[name], name, []);
        }
    }
    addSchema(name: string, schema: any): void {
        if(schema) {
            this.schemaConfig[name] = schema;
        }
    }
    getSchemas() {
        return this.schemaConfig;
    }
    private doValidate(data: any, schema: any, name?: string, prefixKey?: string[]): boolean {
        const properties = schema?.properties;
        if(properties) {
            for(const attrKey of Object.keys(properties)) {
                const config = properties[attrKey];
                const isRequired = config.isRequired;
                const type = config?.type;
                const keyPathArray = [...prefixKey, attrKey];
                const keyPath = [...prefixKey, attrKey].join(".");
                let importRules = false;
                if(isRequired && data && (undefined === data[attrKey] || null === data[attrKey])) {
                    data[attrKey] = config.default;
                    throw new Error(`配置${name}数据属性${keyPath}是必须设置参数不能为空。`);
                }
                if(data) {
                    if(/^#/.test(type)) {
                        const schemaName = type.replace(/^#/, "");
                        const useSchema = this.schemaConfig[schemaName] || this.runSchema[schemaName];
                        if(useSchema) {
                            importRules = true;
                            if(useSchema.dataType) {
                                Object.keys(useSchema.dataType).map((attrKey: string) => {
                                    this.runSchema[attrKey] = useSchema.dataType[attrKey];
                                });
                            }
                            this.doValidate(data[attrKey], useSchema, schemaName, keyPathArray);
                        } else {
                            throw new Error(`配置${name}参数属性${keyPath}引用规则(${schemaName})不存在`);
                        }
                    } else {
                        if(/Array\<[#a-zA-Z0-9]{1,}\>/.test(type)) {
                            this.checkArrayTypes(data[attrKey], type, keyPath, name, keyPathArray);
                        } else {
                            if(!this.checkType(data[attrKey], type, keyPath, name)) {
                                const typeDesc = utils.isRegExp(type) ? type.source : JSON.stringify(type);
                                throw new Error(`配置${name}数据属性${keyPath}数据类型不正确，定义类型：${typeDesc}, 配置数据：${JSON.stringify(data[attrKey])}`);
                            } else {
                                if(config.length > 0) {
                                    if(data[attrKey]?.length !== config.length) {
                                        throw new Error(`配置${name}数据属性${keyPath}数据长度必须是${config.length}位。`);
                                    }
                                } else if(config.maxLength > 0) {
                                    if(data[attrKey]?.length > config.maxLength) {
                                        throw new Error(`配置${name}数据属性${keyPath}数据长度不能大于${config.maxLength}。`);
                                    }
                                } else if(config.minLength > 0) {
                                    if(data[attrKey]?.length < config.minLength) {
                                        throw new Error(`配置${name}数据属性${keyPath}数据长度必须大于${config.minLength}。`);
                                    }
                                }
                            }
                        }
                    }
                    !importRules && this.doValidate(data[attrKey], config, name, keyPathArray);
                }
            }
        }
        return true;
    }
    private checkArrayTypes(data: any, type: string, keyPath: string, name: string, prefixArray: string[]):any {
        const typeRegExp = /^Array\<([#0-9a-zA-Z]{1,})\>$/;
        const dataMatch = type.match(typeRegExp);
        const declareTypes = this.schemaConfig[name]?.dataType || {};
        if(utils.isArray(data)) {
            if(dataMatch) {
                const arrayItemType = dataMatch[1];
                if(/^[a-z]{1,}$/i.test(arrayItemType)) {
                    let index = 0;
                    for(const dataItem of data) {
                        this.checkType(dataItem, arrayItemType, keyPath + "." + index, name);
                        index += 1;
                    }
                } else {
                    const useItemType = arrayItemType.replace(/^#/, "");
                    const useTypeSchema = declareTypes[useItemType] || this.schemaConfig[useItemType];
                    let index = 0;
                    for(const dataItem of data) {
                        this.doValidate(dataItem, useTypeSchema, name, [...prefixArray, index.toString()]);
                        index+=1;
                    }
                }
            } else {
                throw new Error(`配置${name}定义类型错误(${keyPath})。`)
            }
        } else {
            if(/^Array\<[a-zA-Z0-9]{1,}\>$/.test(type)) {
                if(data && type.indexOf(data)<0) {
                    throw new Error(`配置${name}参数${keyPath}数据类型错误定义类型：${type}。[Aarry_I500]`);
                }
            } else {
                throw new Error(`配置${name}参数${keyPath}数据类型错误定义类型：${type}。[Aarry_D500]`);
            }
        }
    }
    private checkType(data: any, type:String|RegExp, keyPath: string, name: string) {
        if(undefined === data || null === data) {
            return true;
        } else {
            if(utils.isRegExp(type)) {
                return type.test(data);
            } else if(utils.isArray(type)) {
                if(utils.isArray(data)) {
                    // do the validate if the config data is an array
                    let pass = true;
                    for(const item of data) {
                        if(type.indexOf(item) < 0) {
                            pass = false;
                            break;
                        }
                    }
                    return pass;
                } else {
                    return type.indexOf(data) >= 0;
                }
            } else if(utils.isString(type)) {
                switch(type) {
                    case "String": {
                        return utils.isString(data);
                    }
                    case "Object": {
                        return utils.isObject(data);
                    }
                    case "Array": {
                        return utils.isArray(data);
                    }
                    case "RegExp": {
                        return utils.isRegExp(data);
                    }
                    case "Number": {
                        return utils.isNumber(data);
                    }
                    case "Boolean": {
                        return utils.isBoolean(data);
                    }
                    default: {
                        throw new Error(`配置${name}参数${keyPath}数据类型错误：${type}, [String, Object, Array, RegExp, Number]`);
                    }
                }
            } else {
                throw new Error(`配置${name}参数${keyPath}数据类型错误：${type}, [String, Object, Array, RegExp, Number]`);
            }
        }
    }
};

