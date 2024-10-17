
export interface IConfigServer {
    port: number;
    host: string;
    publicKey: string;
    staticPath: string;
    staticRoute: string;
    uploadPath: string;
    tempPath: string;
    rootPath: string;
}