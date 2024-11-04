
export interface IConfigServer {
    port: number;
    host: string;
    publicKey: string;
    staticPath: string;
    staticRoute: string;
    uploadPath: string;
    generateTypePath?: string;
    tempPath: string;
}