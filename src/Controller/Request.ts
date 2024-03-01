import "reflect-metadata";
import { createParamDecorator } from "../core/Decorators";
import { Request, Response } from "express";
import utils from '../utils/utils';

export const GetRequestBody = (name?: string) => (target: Object, methodName: string, paramIndex: number) => {
    createParamDecorator({
        target,
        func: methodName,
        paramIndex
    }, () => {
        return (req: Request) => {
            return !utils.isEmpty(name) ? req.body[name] : req.body;
        };
    });
};

export const QueryParam = (id?: string) => (target: Object, methodName: string, paramIndex: number) => {
    createParamDecorator({
        target,
        func: methodName,
        paramIndex
    }, () => {
        return (req: Request) => {
            const uri = utils.toUri(req.query as any);
            return utils.isEmpty(id) ? uri : uri[id];
        };
    });
};

export const RequestHeader = (target: Object, methodName: string, paramIndex: number) => {
    createParamDecorator({
        target,
        func: methodName,
        paramIndex
    }, () => {
        return (req: Request) => {
            return req.headers || {};
        };
    });
};

export const RequestCookie = (target: Object, methodName: string, paramIndex: number) => {
    createParamDecorator({
        target,
        func: methodName,
        paramIndex
    }, () => {
        return (req: Request) => {
            return req.cookies || {};;
        };
    });
};

export const GetCookie = (name: string) => (target: Object, methodName: string, paramIndex: number) => {
    createParamDecorator({
        target,
        func: methodName,
        paramIndex
    }, () => {
        return (req: Request) => {
            const cookieData =  req.cookies || {};
            return !utils.isEmpty(name) ? cookieData[name] : cookieData;
        };
    });
};

export const GetRequest = (target: Object, methodName: string, paramIndex: number) => {
    createParamDecorator({
        target,
        func: methodName,
        paramIndex
    }, () => {
        return (req: Request) => {
            return req;
        };
    });
};

export const GetResponse = (target: Object, methodName: string, paramIndex: number) => {
    createParamDecorator({
        target,
        func: methodName,
        paramIndex
    }, () => {
        return (_: Request, res: Response) => {
            return res;
        };
    });
};

export const GetSessionId = (target: Object, methodName: string, paramIndex: number) => {
    // NODE_SESSION_ID
    createParamDecorator({
        target,
        func: methodName,
        paramIndex
    }, () => {
        return (req: Request) => {
            const NODE_SESSION_ID = (req.cookies || {}).NODE_SESSION_ID;
            return NODE_SESSION_ID;
        };
    });
}