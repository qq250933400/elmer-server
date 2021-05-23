import * as log4js from "log4js";
import * as path from "path";

const rootPath = process.cwd();
log4js.configure({
    appenders: {
        console: {
            type: "console"
        },
        cheeseLogs: {
            type: "file",
            filename: path.resolve(rootPath, "./logs/cheese.log"),
            category: "cheese"
        }
    },
    categories: {
        default: {appenders: ['console', 'cheeseLogs'], level: 'info'}
    }
});

export const logger = log4js.getLogger("cheese");

