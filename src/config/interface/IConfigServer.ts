
export interface IConfigServer {
    port: number;
    host: string;
    publicKey: string;
    staticPath: string;
    staticRoute: string;
    uploadPath: string;
    generateTypePath?: string;
    tempPath: string;
    /** session过期时间，默认30分钟 */
    sessionExpired?: number;
}