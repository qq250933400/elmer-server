import "reflect-metadata";
import { DefineParamDecorator } from "./DefineDecorator";
import { Request, Response } from "express";
import utils from './utils';

export const RequestBody = <T={}>(target: Object, methodName: string, paramIndex: number) => {
    DefineParamDecorator(target, methodName, paramIndex, () => {
        return (req: Request, res: Response) => {
            return req.body;
        };
    });
};

export const QueryParam = (key?: string) => {
    return <T={}>(target: Object, methodName: string, paramIndex: number) => {
        DefineParamDecorator(target, methodName, paramIndex, () => {
            return (req: Request, res: Response) => {
                if(utils.isEmpty(key)) {
                    return utils.toUri(req.query as any);
                } else {
                    return utils.getUri(req.query as any, key);
                }
            };
        });
    };
};

export const RequestHeader = (key?: string) => {
    return <T={}>(target: Object, methodName: string, paramIndex: number) => {
        DefineParamDecorator(target, methodName, paramIndex, () => {
            return (req: Request, res: Response) => {
                const headers = req.headers || {};
                if(utils.isEmpty(key)) {
                    return headers;
                } else {
                    return headers[key];
                }
            };
        });
    };
};

export const RequestCookie = (key?: string) => {
    return <T={}>(target: Object, methodName: string, paramIndex: number) => {
        DefineParamDecorator(target, methodName, paramIndex, () => {
            return (req: Request, res: Response) => {
                const cookieObj = req.cookies || {};
                if(utils.isEmpty(key)) {
                    return cookieObj;
                } else {
                    return cookieObj ? cookieObj[key] : null;
                }
            };
        });
    };
};

export const GetRequest = (key?: string) => {
    return <T={}>(target: Object, methodName: string, paramIndex: number) => {
        DefineParamDecorator(target, methodName, paramIndex, () => {
            return (req: Request, res: Response) => {
                return req;
            };
        });
    };
};

export const GetResponse = (key?: string) => {
    return <T={}>(target: Object, methodName: string, paramIndex: number) => {
        DefineParamDecorator(target, methodName, paramIndex, () => {
            return (req: Request, res: Response) => {
                return res;
            };
        });
    };
};