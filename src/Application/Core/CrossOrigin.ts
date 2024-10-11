import { AppService } from "../../Annotation";
import { GetConfig } from "../../Config";
import { IConfigCrossSite, IConfigCrossSiteRule } from "../../Config/interface/IConfigCrossSite";
import utils from "../../utils/utils";

interface ICrossOriginCheckOption {
    headers: Record<string,string>;
    method: string;
    url: string;
    origin: string;
}

@AppService
export class CrossOrigin {
    @GetConfig("Security")
    private configuration!: IConfigCrossSite;

    isValidateRequest(option: ICrossOriginCheckOption): {name: string, value: string}[]|undefined {
        if(this.configuration.enabled) {
            const origin = option.headers.origin?.replace(/\/$/,"") || "";
            const resHeaders = [];
            for(const rule of this.configuration.rules) {
                if(this.isSameOrigin(origin, utils.isArray(rule.domain) ? rule.domain : [rule.domain])) {
                    const matchResult = this.isMatchRule(rule, option);
                    if(matchResult.matchRule) {
                        rule.withCredentials && resHeaders.push({ name: "Access-Control-Allow-Credentials", value: true });
                        resHeaders.push({ name: "Access-Control-Allow-Headers", value: matchResult.headerKeys.join(",") });
                        resHeaders.push({ name: "Access-Control-Allow-Origin", value: option.headers.origin || "*"});
                        resHeaders.push({ name: "Access-Control-Allow-Methods", value: matchResult.methods.join(",")});
                    }
                }
            }
            return resHeaders;
        }
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
        console.log(rule);
        const reqHeaderKeys = Object.keys(option.headers);
        const matchHeaderKeys = [];
        const matchMethod = [];
        let isMatchAllHeaders = false;
        let isMatchRule = false;
        for(const ruleRoute of rule.rules) {
            const isRegExpUrl = ruleRoute.path.includes("/*/") || /\/\*$/.test(ruleRoute.path);
            const matchRuleArr = ruleRoute.path.replace("/*/", "([\\/])").replace(/\/\*$/, "\/[\da-zA-Z_-]{1,}");
            const isUrlMatch = isRegExpUrl && (new RegExp(`^${matchRuleArr}`)).test(option.url) || option.url === ruleRoute.path
            // 使用通配符判断是否符合规则，没有使用通配符对比pathname;
            if(isUrlMatch && (ruleRoute.method.includes(option.method) || ruleRoute.method.includes("*"))) {
                const ruleHeaders = ruleRoute.headers || [];
                isMatchRule = true;
                matchMethod.push(option.method);
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
            }
        }
        return {
            matchRule: isMatchRule,
            headerKeys: matchHeaderKeys,
            methods: matchMethod
        };
    }
}
