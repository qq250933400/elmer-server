export default {
    properties: {
        crossSite: {
            type: "Object",
            isRequired: true,
            properties: {
                rules: {
                    type: "Array<#crossSiteRule>"
                },
                enabled: {
                    type: "Boolean",
                    isRequired: true
                }
            }
        }
    },
    declareTypes: {
        crossSiteRule: {
            type: "Object",
            properties: {
                allowHeaders: {
                    type: "Array<String>"
                },
                domain: {
                    type: "String",
                    isRequired: true
                },
                rules: {
                    type: "Array<#crossSiteRoute>",
                    isRequired: true
                },
                headers: {
                    type: "Object"
                }
            }
        },
        crossSiteRoute: {
            type: "Object",
            properties: {
                path: {
                    type: "String",
                    isRequired: true
                },
                method: {
                    type: [ "GET","POST","OPTIONS","PUT", "DELETE"],
                    isRequired: true
                },
                allowHeaders: {
                    type: "Array<String>"
                },
                headers: {
                    type: "Object"
                }
            }
        }
    }
}