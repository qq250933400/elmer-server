import { getApplicationConfig } from "../config";
import * as crypto from "crypto";

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

/** Encode and decode */
const aseIV = "Tka40pVIWalZAzyL";
const algorithm = "aes-128-cbc";
const defaultPublicKey = "DOYPdezphI3p0135";

const aseEncode = (val: string): string => {
    const serverConfig = getApplicationConfig()?.Server;
    const encodeKey = serverConfig?.publicKey || defaultPublicKey;
    const encodeKeyBuffer = Buffer.from(encodeKey, "utf-8");
    const IVBuffer = Buffer.from(aseIV, "utf-8");
    const cipher = crypto.createCipheriv(algorithm, encodeKeyBuffer, IVBuffer);
    return cipher.update(val, "utf-8", "hex") + cipher.final("hex");
};
const aseDecode = (crypted: string):string => {
    const serverConfig = getApplicationConfig()?.Server;
    const encodeKey = serverConfig?.publicKey || defaultPublicKey;
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
const toUri = <T={}>(queryStr: string):T => {
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

const toQuery = (obj: any): string => {
    if(obj) {
        const objArr = [];
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
const guid = (): string => {
    const S4 = ():string => {
        // tslint:disable-next-line: no-bitwise
        return (((1 + Math.random())*0x10000) | 0).toString(16).substr(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4());
};

export default {
    aseEncode,
    aseDecode,
    isArray,
    isBoolean,
    isEmpty,
    isObject,
    isString,
    isRegExp,
    isNumber,
    getType,
    getRandomText,
    getUri,
    guid,
    toUri,
    toQuery
};
