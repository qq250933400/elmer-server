import { ABasePlugin, TypePluginCallbackOption, TypePluginType } from "./ABasePlugin";
import { destroyDataModel } from "../DataModel/ADataModel";

export class DataModelPlugin extends ABasePlugin {
    init(): void {

    }
    getId(): string {
        return "plugin_dataModel_22ce3600-c53d-4aa0-a871-bb221715ee3b";
    }
    getType(): TypePluginType {
        return "Request";
    }
    destory(sessionId: string) {
        destroyDataModel(sessionId);
    }
}