type TypeRequestMethod = "GET" | "POST" | "OPTIONS" | "PUT" | "DELETE";
interface IConfigCrossSiteRoute {
    path: String;
    method: TypeRequestMethod[];
    allowHeaders: String[];
    headers?: any;
}

interface IConfigCrossSiteRule {
    allowHeaders: String[];
    domain: String;
    rules: IConfigCrossSiteRoute[];
    headers?: any;
}

export interface IConfigCrossSite {
    crossSite: {
        enabled: boolean;
        rules: IConfigCrossSiteRule[];
    }
}