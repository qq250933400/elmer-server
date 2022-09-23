import "reflect-metadata";
import { GetConfig, IConfigServer } from "../config";
import { AppService } from "../core/Module";
import { Request } from "express";
import { UploadStream } from "../core/UploadStream";
import { GetLogger } from "../logs";
import utils from "./utils";
import * as path from "path";
import * as fs from "fs";
import { md5 } from "./md5";
import { Logger } from "log4js";
import mediaTypes from "./mediaTypes";

type TypeUploadAction = "Connect" | "Data" | "Complete" | "AfterSave";

export type TypeUploadInfo = {
    fileName: string;
    fileSize: number;
    fileBlockSize: number;
    fileHash: string;
    fileType: string;
    fileMediaType: string;
    fileId: string;
    fileIndex: number;
    fileAction: TypeUploadAction,
    lastModified: number;
    fileTempId?: string;
    filePath?: string;
    fileBlockIndex: number;
};
export type TypeUploadCallback = (action: TypeUploadAction, info: TypeUploadInfo & {
    saveFileName?: string
}) => TypeUploadInfo;

@AppService
export class StaticFiles {

    @GetConfig("Server", "staticPath")
    private path: string;

    @GetConfig("Server")
    private serverConfig: IConfigServer;

    // @GetLogger
    // private logger: Logger;

    private rootPath: string;
    constructor() {
        if(!utils.isEmpty(this.path)) {
            this.rootPath = path.resolve(process.cwd(), this.path);
        } else {
            this.rootPath = path.resolve(process.cwd(), "./static");
        }
    }
    readJson(fileName: string, absolute?: boolean) {
        const localPath = !absolute ? path.resolve(this.rootPath, fileName) : fileName;
        if(fs.existsSync(localPath)) {
            const txt = fs.readFileSync(localPath, "utf8");
            return JSON.parse(txt);
        } else {
            throw new Error("File not found");
        }
    }
    writeFile(fileName: string, data: any, opt?: fs.WriteFileOptions): void {
        fs.writeFileSync(fileName, data, opt);
    }
    readDirSync(path: string): string[] {
        return fs.readdirSync(path, "utf-8");
    }
    /**
     * 检查目录，不存在自动创建
     * @param path 检查地址
     * @param rootPath 设置检查根目录，为安全设置将创建目录限制在指定路径，不允许全局创建
     */
    checkDir(checkPath: string, rootPath: string): void {
        const rootStr = checkPath.substr(0, rootPath.length);
        const rootStrValue = rootStr.replace(/\\/g, "/");
        const rootPathValue = rootPath.replace(/\\/g, "/");
        if(rootStrValue !== rootPathValue) {
            throw new Error("只允许在安全目录创建");
        } else {
            const leftPath = checkPath.substr(rootPath.length).replace(/\\/g, "/");
            const leftPathArr = leftPath.split("/");
            let checkPathValue = rootPathValue;
            for(const tempPath of leftPathArr) {
                let checkTempPath = [checkPathValue, tempPath].join("/");
                checkTempPath = checkTempPath.replace(/\/\//g, "/");
                if(!fs.existsSync(checkTempPath)) {
                    fs.mkdirSync(checkTempPath);
                    fs.chmodSync(checkTempPath,
                        fs.constants.S_IRUSR |
                        fs.constants.S_IWUSR |
                        fs.constants.S_IROTH |
                        fs.constants.S_IWOTH |
                        fs.constants.S_IRGRP |
                        fs.constants.S_IWGRP |
                        fs.constants.S_IRWXU |
                        fs.constants.W_OK |
                        fs.constants.R_OK
                    );
                }
                checkPathValue = checkTempPath;
            }
        }
    }
    getPath(fileName: string): string {
        const tmpFileName = fileName.replace(/\\/g, "/");
        const lastIndex = tmpFileName.lastIndexOf("/");
        return tmpFileName.substring(0, lastIndex);
    }
    readUploadInfo(req: Request): TypeUploadInfo {
        const headers = req.headers || {};
        const name = headers["file_name"] as string;
        const fType = (!utils.isEmpty(headers["file_type"]) ? headers["file_type"] : this.getFileType(name)) as string;
        return {
            fileName: !utils.isEmpty(name) ? decodeURIComponent(name) : "",
            fileSize: headers["file_size"] as any,
            fileType: fType,
            fileMediaType: this.getMediaType(fType),
            fileHash: headers["file_hash"] as string,
            fileAction: headers["file_action"] as any,
            fileId: headers["file_id"] as any,
            fileTempId: headers["file_temp_id"] as any,
            lastModified: headers["lastmodified"] as any,
            fileIndex: headers["file_index"] as any,
            fileBlockSize: headers["file_block_size"] as any,
            filePath: headers["file_path"] as any,
            fileBlockIndex: headers["file_block_index"] as any
        };
    }
    readUploadFile(req: Request, fn:TypeUploadCallback): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const info = this.readUploadInfo(req);
            const fileId: string = info.fileTempId;
            if(info.fileAction === "Connect") {
                const tempId = !utils.isEmpty(info.fileHash) ? md5(info.fileHash) : "file_" + utils.guid();
                const infoName = tempId + ".info";
               
                const saveInfoFile = path.resolve(this.serverConfig.tempPath, infoName);
                const preCheckResult = typeof fn === "function" && fn(info.fileAction, {
                    ...info,
                });
                const blockSize = preCheckResult?.fileBlockSize > 1000 ? preCheckResult?.fileBlockSize : 100000;
                const saveInfo = {
                    ...info,
                    updateData: [],
                    fileBlockSize: blockSize
                };
                if(!fs.existsSync(this.serverConfig.tempPath)) {
                    // this.logger.error("上传文件失败，临时存储路径不存在，请检查设置。");
                    reject({
                        statusCode: "UF_500",
                        message: "上传文件失败，临时存储路径不存在，请检查设置。"
                    });
                    return;
                }
                if(!preCheckResult) {
                    
                    fs.writeFileSync(saveInfoFile, JSON.stringify(saveInfo, null, 4), {
                        encoding: "utf-8"
                    });
                    resolve({
                        statusCode: 200,
                        blockSize,
                        fileTempId: tempId
                    });
                } else {
                    resolve({
                        ...preCheckResult,
                        blockSize,
                        fileTempId: tempId
                    });
                }
            } else if(info.fileAction === "Data") {
                const { fileBlockIndex } = info;
                const tempFileName = `./${fileId}_${fileBlockIndex}.temp`;
                const tmpSaveFileName = path.resolve(this.serverConfig.tempPath, tempFileName);
                const fStream = fs.createWriteStream(tmpSaveFileName);
                req.pipe(fStream, {
                    end: true
                }).on("finish", () => {
                    fStream.close();
                    resolve({
                        statusCode: 200,
                        message: "临时存储成功"
                    });
                }).on("error", (err) => {
                    // this.logger.error(err.stack);
                    reject({
                        statusCode: "UF_501",
                        message: "写入数据失败"
                    });
                });
            } else if(info.fileAction === "Complete") {
                const tempId = fileId || md5(info.fileHash);
                const infoName = path.resolve(this.serverConfig.tempPath, `./${tempId}.info`);
                const tempInfo = this.readUploadTempInfo(infoName);
                const fileSize = info.fileSize;
                const blockSize = tempInfo.fileBlockSize;
                const prefCheck = fn("Complete", info);
                const currentDate = (new Date()).format("YYYY-MM-DD");
                const saveFileName = prefCheck?.fileName || `./${currentDate}/${info.fileName}`;
                const saveAbsoluteFile = /^\./.test(saveFileName) ? path.resolve(this.serverConfig.uploadPath, saveFileName) : path.resolve(this.serverConfig.uploadPath, "." + saveFileName);
                const savePath = this.getPath(saveAbsoluteFile);
                const blockCount = Math.ceil(fileSize / blockSize);
                try{
                    // this.logger.info("上传文件保存到：", savePath);
                    this.checkDir(savePath, this.serverConfig.uploadPath);
                    for(let i=0;i<blockCount;i++) {
                        const tmpFile = `${tempId}_${i}.temp`;
                        const tmpFileName = path.resolve(this.serverConfig.tempPath, tmpFile);
                        const blockData = fs.readFileSync(tmpFileName, {
                            encoding: "binary"
                        });
                        fs.writeFileSync(saveAbsoluteFile, blockData,{
                            encoding: "binary",
                            flag: "a+"
                        });
                        fs.unlinkSync(tmpFileName); // 保存成功删除临时文件
                    }
                    fs.unlinkSync(infoName); //删除缓存信息文件
                    const finalResult =  fn("AfterSave", {
                        ...info,
                        saveFileName
                    });
                    resolve({
                        statusCode: 200,
                        message: "文件上传成功",
                        url: saveFileName,
                        ...(finalResult || {}),
                        type: "AfterSave"
                    });
                } catch(e) {
                    // this.logger.error("保存文件失败，部分临时文件丢失: " , e.stack);
                    console.error(e.stack);
                    reject({
                        statusCode: "UF_505",
                        message: "文件保存失败"
                    })
                }
            }
        });
    }
    /**
     * 根据文件名获取文件后缀
     * @param fileName 文件名
     * @returns 
     */
    public getFileType(fileName: string): string {
        const typeM = fileName.match(/(\.[a-z0-9]{1,})$/i);
        return typeM ? typeM[1] : "";
    }
    /**
     * 根据文件后缀获取文件mediaType
     * @param type 文件后缀
     * @returns 
     */
    public getMediaType(type: string): string {
        const typeV = /^\./.test(type) ? type.substr(1) : type;
        return mediaTypes[typeV] || "plain/text";
    }
    private readUploadTempInfo(fileName: string): TypeUploadInfo {
        const txtInfo = fs.readFileSync(fileName, { encoding: "utf-8" });
        return JSON.parse(txtInfo);
    }
}
