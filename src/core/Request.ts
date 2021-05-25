import "reflect-metadata";
import { DefineParamDecorator } from "./DefineDecorator";
import { Request, Response } from "express";

export const RequestBody = <T={}>(target: Object, methodName: string, paramIndex: number) => {
    DefineParamDecorator(target, methodName, paramIndex, () => {
        return (req: Request, res: Response) => {
            return req.body;
        };
    });
};
