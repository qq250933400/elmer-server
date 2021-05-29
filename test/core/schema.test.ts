import { Schema } from "../../src/core/Schema";
import CrossSiteConfig from "../../src/config/config.schema.crossSite";

const schemaObj = new Schema();
const testData = {
    "crossSite": {
        "enabled": true,
        "rules": [
            {
                "allowHeaders": ["TokenType"],
                "domain": "http://localhost",
                "rules": [
                    {
                        "path": "/login/config",
                        "method": ["GET"],
                        "allowHeaders": ["AMToken", "TEST-ID"]
                    }
                ]
            }
        ]
    }
};

describe("Json或者yml配置参数检查", () => {
    beforeAll(() => {
        schemaObj.addSchema("CrossSite", CrossSiteConfig);
    });
    it("跨域站点配置数据校验", () => {
        let pass = false;
        try {
            schemaObj.validate(testData, "CrossSite");
            pass = true;
        } catch (e) {
            console.error(e);
            pass = false;
        }
        expect(pass).toBe(true);
    });
});