
interface IConfigCrossSiteRoute {
    path: String;
    method: "GET" | "POST" | "OPTIONS" | "PUT" | "DELETE";
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