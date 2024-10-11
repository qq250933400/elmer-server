
export interface IConfigCrossSiteRoute {
    path: string;
    method: string[];
    withCredentials: boolean;
    headers?: string[];
}

export interface IConfigCrossSiteRule {
    allowHeaders: string[];
    domain: string|string[];
    rules: IConfigCrossSiteRoute[];
    withCredentials?: boolean;
    headers?: any;
}

export interface IConfigCrossSite {
    enabled: boolean;
    rules: IConfigCrossSiteRule[];
}