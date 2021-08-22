export default {
    properties: {
        pop3: {
            type: "#domain"
        },
        smtp: {
            type: "#domain"
        },
        imap: {
            type: "#domain"
        },
        user: {
            type: "String",
            isRequired: true
        },
        accessKey: {
            type: "String",
            isRequired: true
        },
        secure: {
            type: "Boolean",
            isRequired: true,
            defaultValue: false
        }
    },
    dataType: {
        domain: {
            type: /^[a-z0-9_\-\.]{1,}[a-z0-9]{1}\.[a-z0-9]{1,}$/i
        }
    }
}
