type TypeRequestMethod = "GET" | "POST" | "OPTIONS" | "PUT" | "DELETE";
interface IConfigCrossSiteRoute {
    path: String;
    method: TypeRequestMethod[];
    allowHeaders: String[];
}

interface IConfigCrossSiteRule {
    allowHeaders: String[];
    domain: String,
    rules: IConfigCrossSiteRoute[];
}

export interface IConfigCrossSite {
    crossSite: {
        enabled: boolean;
        rules: IConfigCrossSiteRule[];
    }
}