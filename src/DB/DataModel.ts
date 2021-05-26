import { ADataEngine } from "./ADataEngine";
import { DBConfig } from "../config";
import { IConfigDB } from "../config/IConfigDB";
import { Mysql } from "./Mysql";
import { GetLogger } from "../logs";
import { Logger } from "log4js";
import utils from "../core/utils";
import DefineDecorator from "../core/DefineDecorator";
import { DECORATOR_MODEL_TYPE } from "../core/GlobalStore";

type TypeSecurityQueryCallback = (model: DataModel) => Promise<any>;
type TypeLogicWord = "OR" | "AND" | "or" | "and";
type TypeExtendsModelAction = {[P in Exclude<keyof TypeModelAction, "select" | "find">]: TypeModelAction[P]};
type TypeModelLimitAction = {[P in Extract<keyof TypeExtendsModelAction, "select" | "find" | "group" | "order">]};
type TypeModelFieldAction = {[P in Extract<keyof TypeExtendsModelAction, "limit" | "order" | "group" | "select" | "find" | "where" | "andWhere" | "orWhere">]};
type TypeModelOrderAction = {[P in Extract<keyof TypeExtendsModelAction, "group" | "limit" | "select">]};
type TypeModelGroupAction = {[P in Extract<keyof TypeExtendsModelAction, "order" | "limit" | "select">]};

type TypeModelAction = {
    select<T={}>(): Promise<T>;
    find<T={}>(): Promise<T>;
    where(_where: string[], _logic?: TypeLogicWord): TypeExtendsModelAction;
    andWhere(_where: string[], _logic?: TypeLogicWord): TypeExtendsModelAction;
    orWhere(_where: string[], _logic?: TypeLogicWord): TypeExtendsModelAction;
    leftJoin(_condition: string, tabName: string): TypeExtendsModelAction;
    rightJoin(_condition: string, tabName: string): TypeExtendsModelAction;
    innerJoin(_condition: string, tabName: string): TypeExtendsModelAction;
    limit(_start: Number, _end: Number): TypeModelLimitAction;
    field(_fields: string[]): TypeModelFieldAction;
    order(_condition: string): TypeModelOrderAction;
    group(_condition: string): TypeModelGroupAction;
};

let AC: TypeModelAction;


export const DBModel = (tabName: string) => {
    return (Target: new(...args:any[]) => any) => {
        DefineDecorator(() => {
            Reflect.defineMetadata(DECORATOR_MODEL_TYPE, "DBModel", Target);
            Reflect.defineMetadata("DB_TABLE_NAME", tabName, Target.prototype);
            (Target as any).tableName = tabName;
        }, Target);
    };
};

export class DataModel {
    @DBConfig()
    private config: IConfigDB;
    @GetLogger()
    private logger: Logger;

    private dataEngine: ADataEngine;
    private dataTableName: string;
    private conditions: any[] = [];
    constructor() {
        const tableName = Reflect.getMetadata("DB_TABLE_NAME", this);
        if(this.config.type === "Mysql") {
            this.dataEngine = new Mysql();
        }
        if(utils.isEmpty(this.config.prefix)) {
            this.dataTableName = tableName;
        } else {
            this.dataTableName = this.config.prefix + tableName;
        }
    }
    connect(): void {
        this.dataEngine.connect();
    }
    destory(): void {
        this.dataEngine.dispose();
    }
    async securityQuery(fn: TypeSecurityQueryCallback): Promise<any> {
        let resultData: any;
        try{
            this.connect();
            resultData = await fn(this);
        } catch(e) {
            this.logger.error(e.stack);
        } finally {
            this.destory();
        }
        return Promise.resolve(resultData);
    }
    async query<T={}>(queryCode: string): Promise<T> {
        this.logger.debug(queryCode);
        return this.dataEngine.query(queryCode);
    }
    alias(aliasChar: string): TypeModelAction {
        this.conditions.push({
            type: "alias",
            data: `${this.dataTableName} as ${aliasChar}`
        });
        return this as any;
    }
    where(condition: any[]): TypeModelAction {
        this.conditions.push({
            type: "where",
            logic: "andy",
            data: condition
        });
        return this as any;
    }
    andWhere(condition: any[]): TypeModelAction {
        this.conditions.push({
            type: "where",
            logic: "and",
            data: condition
        });
        return this as any;
    }
    orWhere(condition: any[]): TypeModelAction {
        this.conditions.push({
            type: "where",
            logic: "or",
            data: condition
        });
        return this as any;
    }
    protected field(fields: string[]): any {
        this.conditions.push({
            type: "field",
            data: fields
        });
        return this;
    }
    protected limit(start:Number, end: Number): any {
        this.conditions.push({
            type: "limit",
            data: {
                start,
                end
            }
        });
        return this;
    }
    protected find<T={}>(): Promise<T> {
        return new Promise<T>((resolve) => {
            console.log("---", this.conditions);
            resolve({} as any);
        });
    }
    protected select<T={}>(): Promise<T> {
        return new Promise<T>((resolve) => {
            this.conditions.push({
                type: "select"
            });
            console.log(this.conditions);
            resolve({} as any);
        });
    }
}