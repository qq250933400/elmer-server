type TypeRequestMethod = "GET" | "POST" | "OPTIONS" | "PUT" | "DELETE";
export interface IConfigCrossSiteRoute {
    path: String;
    method: TypeRequestMethod[];
    allowHeaders: String[];
    withCredentials: boolean;
    headers?: any;
}

export interface IConfigCrossSiteRule {
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