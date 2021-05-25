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

export default {
    aseEncode,
    aseDecode,
    isArray,
    isEmpty,
    isObject,
    isString,
    isRegExp,
    isNumber,
    getType,
    getRandomText
};
