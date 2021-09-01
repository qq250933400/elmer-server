type TypeRequestMethod = "GET" | "POST" | "OPTIONS" | "PUT" | "DELETE";
interface IConfigCrossSiteRoute {
    path: String;
    method: TypeRequestMethod[];
    allowHeaders: String[];
    withCredentials: boolean;
    headers?: any;
}

interface IConfigCrossSiteRule {
    allowHeaders: String[];
    domain: String;
    rules: IConfigCrossSiteRoute[];
    withCredentials?: boolean;
    headers?: any;
}

export interface IConfigCrossSite {
    enabled: boolean;
    rules: IConfigCrossSiteRule[];
}