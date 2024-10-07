export interface IConfigSession {
    savePath: string;
    maxAge: number;
    encode?: boolean;
    publicKey?: string;
    enabled?: boolean;
    sessionIdKey?: 'SSID'
}