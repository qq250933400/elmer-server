import "reflect-metadata";
import { RequestService } from "../core/Module";
import { IConfigSession, GetConfig } from "../config";
import { SessionService } from "./SessionService";
import {
    CONST_DECORATOR_CONTROLLER_REQUESTID
} from "../data/const";
import { utils } from "elmer-common";

interface ISessionData<T={}> {
    dateTime: number;
    data: T;
}

@RequestService
export class Session {

    @GetConfig("Session")
    private config: IConfigSession;

    private requestId: string;
    constructor(
        private sessionService: SessionService
    ) {
        const reqId = Reflect.getMetadata(CONST_DECORATOR_CONTROLLER_REQUESTID, this) ||
            Reflect.getMetadata(CONST_DECORATOR_CONTROLLER_REQUESTID, this.constructor);
        this.requestId = reqId;
    }
    getItem<T={}>(key: string): T|null {
        const sessionData: ISessionData = this.sessionService.read(this.requestId)?.data;
        return utils.getValue(sessionData, key);
    }
    setItem<T={}>(key: string, data: T): void {
        const sessionData: ISessionData = this.sessionService.read(this.requestId) || {};
        const saveSessionData: any = {
            ...(sessionData.data || {})
        };
        saveSessionData[key] = data;
        this.sessionService.save(this.requestId, saveSessionData);
    }
}
