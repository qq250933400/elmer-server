import { AppService, AppModel } from "../../Annotation";
import { GetConfig } from "../../Config";
import { IConfigCrossSite, IConfigCrossSiteRule } from "../../Config/interface/IConfigCrossSite";
import { Log } from "./Log";
import utils from "../../utils/utils";

interface ICrossOriginCheckOption {
    headers: Record<string,string>;
    method: string;
    url: string;
    origin: string;
}

@AppModel(Log)
@AppService
export class CrossOrigin {
    @GetConfig("Security")
    private configuration!: IConfigCrossSite;

    constructor(private log: Log) {}

    isValidateRequest(option: ICrossOriginCheckOption): {name: string, value: string}[]|undefined {
        if(this.configuration.enabled) {
            const origin = option.headers.origin?.replace(/\/$/,"") || "";
            const resHeaders = [];
            let isMatch = false;
            this.log.debug("Request origin: ", origin, option.url);
            for(const rule of this.configuration.rules) {
                // 检查请求url域是否和配置中的域相同，相同则应用配置规则，检查配置设置，设置response header
                if(this.isSameOrigin(origin, utils.isArray(rule.domain) ? rule.domain : [rule.domain])) {
                    const matchResult = this.isMatchRule(rule, option);
                    if(matchResult.matchRule) {
                        rule.withCredentials && resHeaders.push({ name: "Access-Control-Allow-Credentials", value: true });
                        resHeaders.push({ name: "Access-Control-Allow-Headers", value: matchResult.headerKeys.join(",") });
                        resHeaders.push({ name: "Access-Control-Allow-Origin", value: option.headers.origin || "*"});
                        resHeaders.push({ name: "Access-Control-Allow-Methods", value: matchResult.methods.join(",")});
                    }
                    isMatch = true;
                }
            }
            !isMatch && this.log.debug(`Not match cross origin rule: ${origin}`);
            return resHeaders;
        }
    }
    /**
     * 检测是否是简单请求,并且需要做跨域检查
     */
    isSempleRequestWithCrossOrigin(option: ICrossOriginCheckOption) {
        const requestHeaderKeys = option.headers['access-control-request-method'];
        const origin = option.headers.origin?.replace(/^https?:\/\//,"") || "";
        const host = option.headers.host;
        return utils.isEmpty(requestHeaderKeys) && origin?.toLowerCase() !== host?.toLowerCase() && option.method !== "OPTIONS";
    }
    private isSameOrigin(origin: string, hostList: string[]): boolean {
        for(const host of hostList) {
            const originValue = origin.replace(/\/$/,"");
            const hostValue = host.replace(/\/$/,"");
            if(originValue === hostValue) {
                return true;
            }
        }
        return false;
    }
    private isMatchRule(rule: IConfigCrossSiteRule, option: ICrossOriginCheckOption) {
        const reqHeaderKeys = option.method === "OPTIONS" ? option.headers["access-control-request-headers"].split(",") : Object.keys(option.headers);
        const reqMethod = option.method === "OPTIONS" ? option.headers["access-control-request-method"] : option.method;
        const matchHeaderKeys = [];
        let isMatchAllHeaders = rule.allowHeaders.includes("*");
        let isMatchRule = false;
        for(const ruleRoute of rule.rules) {
            let isMatchUrl = ruleRoute.path === option.url;
            if(/\/\*$/.test(ruleRoute.path)) {
                const pathReg = new RegExp("^" + ruleRoute.path.replace(/\*$/,""));
                isMatchUrl = pathReg.test(option.url);
            }
            if(isMatchUrl && (ruleRoute.method.includes(reqMethod) || ruleRoute.method.includes("*"))) {
                const ruleHeaders = ruleRoute.headers || [];
                isMatchRule = true;
                if(ruleHeaders.includes("*")) {
                    isMatchAllHeaders = true;
                    matchHeaderKeys.push(...reqHeaderKeys);
                } else if(!isMatchAllHeaders) {
                    ruleHeaders.forEach((ruleHeaderKey) => {
                        if(reqHeaderKeys.includes(ruleHeaderKey.toLocaleLowerCase())) {
                            matchHeaderKeys.push(ruleHeaderKey.toLocaleLowerCase());
                        }
                    })
                }
                break;
            }
        }
        return {
            matchRule: isMatchRule,
            headerKeys: isMatchAllHeaders ? reqHeaderKeys : matchHeaderKeys,
            methods: [ reqMethod ]
        };
    }
}
