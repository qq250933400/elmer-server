import "reflect-metadata";
import { DefineParamDecorator } from "./DefineDecorator";
import { Request, Response } from "express";
import utils from './utils';
import { createDataModel } from "../DataModel/ADataModel";

export const RequestBody = <T={}>(target: Object, methodName: string, paramIndex: number) => {
    DefineParamDecorator(target, methodName, paramIndex, () => {
        return (req: Request, res: Response) => {
            return req.body;
        };
    });
};

export const QueryParam = (target: Object, methodName: string, paramIndex: number) => {
    DefineParamDecorator(target, methodName, paramIndex, () => {
        return (req: Request, res: Response) => {
            return utils.toUri(req.query as any);
        };
    });
};

export const RequestHeader = (target: Object, methodName: string, paramIndex: number) => {
    DefineParamDecorator(target, methodName, paramIndex, () => {
        return (req: Request, res: Response) => {
            return req.headers || {};
        };
    });
};

export const RequestCookie = (target: Object, methodName: string, paramIndex: number) => {
    DefineParamDecorator(target, methodName, paramIndex, () => {
        return (req: Request, res: Response) => {
            return req.cookies || {};;
        };
    });
};

export const GetRequest = (target: Object, methodName: string, paramIndex: number) => {
    DefineParamDecorator(target, methodName, paramIndex, () => {
        return (req: Request, res: Response) => {
            return req;
        };
    });
};

export const GetResponse = (target: Object, methodName: string, paramIndex: number) => {
    DefineParamDecorator(target, methodName, paramIndex, () => {
        return (req: Request, res: Response) => {
            return res;
        };
    });
};

export const GetDataModel = (CLSDataModel: new(...args: any[]) => any) => {
    return (target: Object, methodName: string, paramIndex: number) => {
        DefineParamDecorator(target, methodName, paramIndex, () => {
            return (req: Request) => {
                const sessionId = req.sessionID;
                return createDataModel(sessionId, CLSDataModel);
            };
        });
    }
}