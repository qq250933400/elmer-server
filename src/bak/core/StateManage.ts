import "reflect-metadata";
import { AppService, createInstance, delegateInit } from "./Module";
import { utils } from "elmer-common";
import { CONST_DECORATOR_FOR_MODULE_INSTANCEID } from "../data";

export type TypeStateAction<T={}> = { [P in keyof T]: TypeStateAction<T[P]> & {
    get: () => T[P];
    set:(state: {[P in keyof T]?:T[P]}) => void;
}};

type TypeStateManagement<T={}> = TypeStateAction<T>;
type TypeCreateActions<T={}> = {
    stateName: string;
    createActions: (stateObj: StateManage) => TypeStateManagement<T>;
};

const createDelegateStateAction = <T={}>(stateObj: StateManage, name: string, initState: T, prefix?: string):any => {
    const stateData: any = {};
    if(initState) {
        Object.keys(initState).forEach((stateKey: string) => {
            const stateValue = initState[stateKey];
            const statePath: string = prefix ? prefix + "." + stateKey : stateKey;
            const getState = stateObj.createGetState(name, statePath);
            const setState = stateObj.createSetState(name, statePath, stateValue);
            let exState: any = {};
            if(utils.isObject(stateValue)) {
                exState = createDelegateStateAction(stateObj, name, stateValue, statePath);
            }
            stateData[stateKey] = {
                ...exState,
                get: getState,
                set: setState
            }
        });
    }
    return stateData;
};

export const createStateActions = <T={}>(name: string, initState: T): TypeCreateActions<T> => {
    const storeAction = (stateObj: StateManage) => createDelegateStateAction(stateObj, name, initState);
    return {
        stateName: name,
        createActions: storeAction
    };
}

@AppService
export class StateManage {
    state: any = {};
    stateActions: any = {};
    createGetState(name: string, path: string): Function {
        return () => {
            return utils.getValue(this.state[name], path);
        };
    }
    createSetState(name: string, path: string, initState?: any): Function {
        this.initState(name, path, initState);
        return (newState: any) => {
            utils.setValue(this.state[name], path, newState);
        };
    }
    registe(name: string, stateAction: any): void {
        if(!this.stateActions[name]) {
            this.stateActions[name] = stateAction;
        } else {
            throw new Error("注册失败，不允许重复注册state。" + "(" + name + ")");
        }
    }
    invoke<T={}>(name: string, path?: string): TypeStateManagement<T> {
        const stateActions = this.stateActions[name] || {};
        if(!utils.isEmpty(path)) {
            return utils.getValue(stateActions, path);
        } else {
            return stateActions;
        }
    }
    private initState(name: string, path: string, initState?: any): void {
        if(!this.state[name]) {
            this.state[name] = {};
        }
        utils.setValue(this.state[name], path, initState);
    }
}

export const StateStore = <T={}>(stateActions: TypeCreateActions<T>) => {
    return (Target: new(...args:any[]) => any) => {
        delegateInit(() => {
            const instanceId = Reflect.getMetadata(CONST_DECORATOR_FOR_MODULE_INSTANCEID, Target);
            const stateObj = createInstance(StateManage, instanceId);
            const createActions = stateActions.createActions;
            const states = createActions(stateObj);
            stateObj.registe(stateActions.stateName, states);
        })(Target);
    };
}