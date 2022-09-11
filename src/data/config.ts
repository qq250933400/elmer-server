import { createStateActions } from "../core/StateManage";

export const configState = createStateActions("applicationConfig", {
    server: {},
    database: {},
    log: {},
    email: {},
    security: {}
});