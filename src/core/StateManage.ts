import "reflect-metadata";
import { AppService, createInstance, delegateInit } from "./Module";
import { utils } from "elmer-common";
import { CONST_DECORATOR_FOR_MODULE_INSTANCEID } from "../data";

type TypeStateAction<T={}> = { [P in keyof T]: TypeStateAction<T[P]> & {
    get: () => T[P];
    set:(state: {[P in keyof T]?:T[P]}) => void;
}};
type TypeStateManagement<T={}> = TypeStateAction<T>;
type TypeCreateActions<T={}> = (stateObj: StateManage) => TypeStateManagement<T>;

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
    return (stateObj: StateManage) => createDelegateStateAction(stateObj, name, initState);
}

@AppService
export class StateManage {
    state: any = {};
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
            stateActions(stateObj);
        })(Target);
    };
}