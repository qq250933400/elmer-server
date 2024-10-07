import * as crypto from "crypto";
import * as fs from 'fs';
import { md5 } from "./md5";
import { v7 as uuid } from "uuid";
import type { V7Options } from "uuid";

const getType = (val: any): string => Object.prototype.toString.call(val);
/**
 * 变量是否为空
 * @param val 
 * @returns 
 */
const isEmpty = (val: any): Boolean => (undefined === val || null === val || (typeof val === "string" && val.length<=0));
/**
 * 是否是Object对象
 * @param val 
 * @returns 
 */
const isObject = (val:any): val is Object => typeof val === "object";
/**
 * 是否为文本
 * @param val 
 * @returns 
 */
const isString = (val:any): val is String => typeof val === "string";
/**
 * 是否为正则表达式对象
 * @param val 
 * @returns 
 */
const isRegExp = (val: any): val is RegExp => getType(val) === "[object RegExp]";
/**
 * 是否为数组
 * @param val 
 * @returns 
 */
const isArray = <T={}>(val: any): val is Array<T> => getType(val) === "[object Array]";

const isNumber = (val: any): val is Number => getType(val) === "[object Number]";

const isBoolean = (val: any): val is Boolean => getType(val) === "[object Boolean]";

const isPromise = (val: any): val is Promise<any> => getType(val) === "[object Promise]";

const isNumeric = (val:any): val is Boolean => !isNaN(val);
/** 判断对象是否是Global这个Node环境全局对象 */
const isGlobalObject = (val:any): boolean => getType(val) === "[object global]";

/** Encode and decode */
const aseIV = "Tka40pVIWalZAzyL";
const algorithm = "aes-128-cbc";
const defaultPublicKey = "DOYPdezphI3p0135";

const aseEncode = (val: string, publicKey: string): string => {
    const encodeKey = publicKey;
    const encodeKeyBuffer = Buffer.from(encodeKey, "utf-8");
    const IVBuffer = Buffer.from(aseIV, "utf-8");
    const cipher = crypto.createCipheriv(algorithm, encodeKeyBuffer, IVBuffer);
    return cipher.update(val, "utf-8", "hex") + cipher.final("hex");
};
const aseDecode = (crypted: string, publicKey: string):string => {
    const encodeKey = publicKey;
    const encodeKeyBuffer = Buffer.from(encodeKey, "utf-8");
    const IVBuffer = Buffer.from(aseIV, "utf-8");
    const decCipher = crypto.createDecipheriv(algorithm, encodeKeyBuffer, IVBuffer);
    return decCipher.update(crypted, 'hex', "utf-8") + decCipher.final('utf-8');
};

const getRandomText = (len: number = 8):string => {
    if(len > 5) {
        const baseStr = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890";
        let str = "";
        let baseLen = baseStr.length;
        for(let i=0;i<len;i++) {
            const index = Math.floor(Math.random()*baseLen);
            str += baseStr.substr(index, 1);
        }
        return str;
    }
    return "";
}

/** Http */
const toUri = <T={}>(queryStr: string):T|undefined => {
    if(!isEmpty(queryStr)) {
        if(isString(queryStr)) {
            let textQuery = queryStr.replace(/^\?/, "").replace(/^\s*/, "").replace(/\#[\s\S]*$/, "");
            const arr = textQuery.split("&");
            const result = {};
            const qVReg = /^([a-z0-9_\-]{1,})=([\s\S]*)$/i;
            for(const qStr of arr) {
                const qMatch = qStr.match(qVReg);
                if(qMatch) {
                    result[qMatch[1]] = decodeURIComponent(qMatch[2]);
                } else {
                    const qKey = qStr.replace(/\=\s*$/, "");
                    result[qKey] = true;
                }
            }
            return result as any;
        } else {
            return queryStr;
        }
    }
}

const toQuery = (obj: any): string|undefined => {
    if(obj) {
        const objArr: string[] = [];
        Object.keys(obj).map((attrKey) => {
            const attrValue = obj[attrKey];
            const attrStr = attrValue ? (
                isObject(attrValue) ? encodeURIComponent(JSON.stringify(attrValue)) : encodeURIComponent(attrValue)
            ): "";
            objArr.push(`${attrKey}=${attrStr}`);
        });
        return objArr.join("&");
    }
}
const getUri = <T={}>(queryStr: string, key: string): T => {
    const queryObj = toUri(queryStr);
    return queryObj ? queryObj[key] : null;
};
const getValue = <T>(data:object, key:string, defaultValue?: any): T => {
    const keyValue = key !== undefined && key !== null ? key : "";
    if (/\./.test(keyValue)) {
        const keyArr = keyValue.split(".");
        let isFind = false;
        let index = 0;
        let keyStr:any = "";
        let tmpData:any = data;
        while (index <= keyArr.length - 1) {
            keyStr = keyArr[index];
            isFind = index === keyArr.length - 1;
            if(isArray(tmpData) && isNumeric(keyStr)) {
                keyStr = parseInt(keyStr as any, 10);
            }
            if(!isFind) {
                const nextKey = keyArr[keyArr.length - 1];
                if(isArray(tmpData) || isObject(tmpData) || isGlobalObject(tmpData)) {
                    //
                    tmpData = tmpData[keyStr];
                }
                if(tmpData && index === keyArr.length - 2) {
                    if(nextKey === "key") {
                        tmpData = tmpData.key;
                        isFind = true;
                    } else if(nextKey === "length") {
                        tmpData = tmpData.length;
                        isFind = true;
                    }
                }
            } else {
                tmpData = tmpData ? tmpData[keyStr] : undefined;
            }
            if(isFind) {
                break;
            }
            index++;
        }
        return isFind ? (undefined !== tmpData ? tmpData : defaultValue) : defaultValue;
    } else {
        const rResult = data ? (<any>data)[keyValue] : undefined;
        return data ? (undefined !== rResult ? rResult : defaultValue) : defaultValue;
    }
};
/**
 * 给指定对象设置属性值
 * @param data 设置属性值对象
 * @param key 设置属性key,属性key有多层可使用.区分
 * @param value 设置属性值
 * @param fn 自定义设置值回调
 */
const setValue = (data:object, key:string, value:any, fn?: Function): boolean => {
    let isUpdate = false;
    if(!isObject(data)) {
        throw new Error("The parameter of data is not a object");
    }
    if(isEmpty(key)) {
        throw new Error("The key can not be an empty string");
    }
    if(!isEmpty(value)) {
        const keyArr = key.split(".");
        const keyLen = keyArr.length;
        let index = 0;
        let tmpData = data;
        while(index<keyLen) {
            const cKey = keyArr[index];
            if(index < keyLen - 1) {
                // 不是最后一个节点
                if(!isEmpty(tmpData[cKey])) {
                    if(isObject(tmpData[cKey])) {
                        tmpData = tmpData[cKey];
                    } else {
                        throw new Error("Can not set value to attribute of " + cKey);
                    }
                } else {
                    tmpData[cKey] = {};
                    tmpData = tmpData[cKey];
                }
            } else {
                // 要更新数据的节点
                if(typeof fn === "function") {
                    fn(tmpData, cKey, value);
                } else {
                    tmpData[cKey] = value;
                }
                isUpdate = true;
            }
            index++;
        }
    }
    return isUpdate;
};

const fildMD5 = (fileName: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        if(fs.existsSync(fileName) && fs.lstatSync(fileName).isFile()) {
            const fReadStream = fs.createReadStream(fileName);
            const fHash = crypto.createHash("sha256");
            fReadStream.on('data', function (d) {
                fHash.update(d);
            });
            fReadStream.on('end', function () {
                const md5 = fHash.digest('hex');
                resolve(md5);
            });
            fReadStream.on("error", (err) => {
                reject({
                    statusCode: "RF_501",
                    message: "读取文件错误"
                });
            })
        } else {
            reject({
                statusCode: "RF_500",
                message: "文件不存在"
            });
        }
    });
};
const fildMD5Async = (fileName: string): string|null|undefined => {
    if(fs.existsSync(fileName) && fs.lstatSync(fileName).isFile()) {
        const fHash = crypto.createHash("sha256");
        const buffer = fs.readFileSync(fileName, {
            encoding: "binary"
        });
        fHash.update(buffer);
        return fHash.digest("hex");
    }
}
const invoke = function(fn: Function, owner?: any, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
        const fResult = fn.apply(owner, args);
        if(isPromise(fResult)) {
            fResult.then(resolve).catch(reject);
        } else {
            resolve(fResult);
        }
    });
};
const invokeEx = <T extends Object>(obj: T, method: keyof T, ...params: any[]): Promise<any> => {
    if(typeof obj[method] === "function") {
        obj[method].bind(obj);
        return invoke(obj[method], obj, ...params);
    } else {
        return Promise.reject("The method " + method.toString() + " is not a function");
    }
};
const getCommand = function (command: string[], cmdKey: string) {
    let result: string|undefined = undefined;
    let findKey = false;
    let findValue = false;
    const keyReg = /^[\-]{1,}/;
    const keyValueReg = /^([a-z0-9_]{1,})\=/i;
    const isCmdKey = /^[\-]{1,}/.test(cmdKey);
    if (command && command.length > 0) {
        for (var i = 0; i < command.length; i++) {
            var cmd = command[i];
            if (isCmdKey) {
                if (cmd === cmdKey) {
                    if (!keyReg.test(command[i + 1])) {
                        result = command[i + 1];
                        findValue = i + 1 < command.length;
                        break;
                    }
                }
            }
            else {
                if (!keyReg.test(cmd)) {
                    var keyMatchValue = cmd.match(keyValueReg);
                    if (keyMatchValue && keyMatchValue[1] === cmdKey) {
                        result = cmd.replace(keyValueReg, "");
                        findValue = true;
                        break;
                    }
                    else {
                        if (cmd === cmdKey && !keyReg.test(command[i - 1])) {
                            findKey = true;
                        }
                    }
                }
            }
        }
    }
    return findValue ? result : (findKey ? null : result);
};

const getFilePath =  (fileName: string): string => {
    const tmpFileName = fileName.replace(/\\/g, "/");
    const lastIndex = tmpFileName.lastIndexOf("/");
    return tmpFileName.substring(0, lastIndex);
};

/**
* 根据文件名获取文件后缀
* @param fileName 文件名
* @returns 
*/
const getFileType = (fileName: string): string => {
   const typeM = fileName.match(/\.([a-z0-9]{1,})$/i);
   return typeM ? typeM[1] : "";
}
/**
 * 获取文件名，包含文件后缀
 * @param fileName - 文件路径
 */
const getFileName = (fileName: string): string => {
    const tmpFileName = fileName.replace(/\\/g, "/");
    const lastIndex = tmpFileName.lastIndexOf("/");
    return lastIndex >= 0 ? tmpFileName.substring(lastIndex + 1) : tmpFileName;
};
/**
 * 获取文件名，不含文件后缀
 * @param fileName - 文件路径
 * @returns 
 */
const getFileNameEx = (fileName: string): string => {
    const name = getFileName(fileName);
    return name.replace(/\.[a-z0-9_]{1,}$/i, "");
};

const uuidFn = (opt?: V7Options) => uuid(opt);

export default {
    aseEncode,
    aseDecode,
    isArray,
    isBoolean,
    isEmpty,
    isGlobalObject,
    isObject,
    isPromise,
    isString,
    isRegExp,
    isNumber,
    isNumeric,
    getType,
    getRandomText,
    getUri,
    getValue,
    getCommand,
    getFilePath,
    getFileType,
    getFileName,
    getFileNameEx,
    fildMD5,
    fildMD5Async,
    toUri,
    toQuery,
    setValue,
    md5,
    invoke,
    invokeEx,
    uuid: uuidFn
};
