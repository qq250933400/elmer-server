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