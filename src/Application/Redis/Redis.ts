import { AppService, AppModel } from "../../Annotation";
import { GetConfig } from "../../Config";
import { IConfigRedis } from "../../Config/interface/IConfigRedis";
import { IConfigServer } from "../../Config/interface/IConfigServer";
import { UtilsService } from "../../Module/UtilsService";
import { RedisClientType, RedisDefaultModules, createClient } from "redis";
import { Log } from "../Core/Log";
import utils from "../../utils/utils";

interface IRedisSaveOption {
    database?: number;
    expire?: number;
}

interface IRedisApi {
    get<T>(key: string, database?: number): Promise<T>;
    set(key: string, value: string|number, opt?: IRedisSaveOption): Promise<string>;
    delete(key: string, database?: number): Promise<string>;
}

@AppModel(UtilsService, Log)
@AppService
export class Redis {
    @GetConfig("Redis")
    private config: IConfigRedis;
    @GetConfig("Server")
    private serverConfig: IConfigServer;

    private clientStore: Record<number, RedisClientType<RedisDefaultModules>> = {};

    constructor(
        private utilsService: UtilsService,
        private log: Log
    ) {
    }
    get(key: string, database?: number) {
        return new Promise((resolve, reject) => {
            this.getConnection(database).then((client) => {
                client.get(key).then(resolve).catch(reject);
            }).catch(reject);
        });
    }
    set(key: string, value: string|number, opt?: IRedisSaveOption) {
        return new Promise((resolve, reject) => {
            this.getConnection(opt?.database).then((client) => {
                client.set(key, value, {
                    // "EXAT": opt.expire || 6000
                }).then((res) => {
                    opt?.expire > 0 && client.isOpen && client.expire(key, opt.expire);
                    resolve(res);
                }).catch(reject);
            }).catch(reject);
        });
    }
    delete(key: string, database?: number) {
        return new Promise((resolve, reject) => {
            this.getConnection(database).then((client) => {
                client.del(key).then(resolve).catch(reject);
            }).catch(reject);
        });
    }
    quit(database: number): void {
        try {
            this.log.info(`Release redis connection, database: ${database}`);
            if(this.clientStore[database] && this.clientStore[database].isOpen) {
                this.clientStore[database].quit();
                delete this.clientStore[database];
            }
        } catch(err) {
            this.log.error(err.stack);
        }
    }
    /**
     * 自动调用quit方法
     * @param fn 回调
     */
    async withRedis(fn: (redis: IRedisApi) => Promise<any>, database?: number) {
        try {
            await fn({
                set: this.set.bind(this),
                get: this.get.bind(this),
                delete: this.delete.bind(this)
            });
            this.quit(database || 0);
        } catch(e) {
            this.log.error(e.stack);
        }
    }
    private getConnection(database: number) {
        return new Promise<RedisClientType<RedisDefaultModules>>((resolve, reject) => {
            const password = !utils.isEmpty(this.serverConfig.publicKey) ? this.utilsService.aseDecode(this.config.password) : this.config.password;
            const connDabase = !isNaN(database) ? database : !isNaN(this.config.database) ? this.config.database : 0;
            if(!this.clientStore[connDabase]) {
                const redisClient: RedisClientType<RedisDefaultModules> = createClient({
                    "url": `redis://default:${password}@${this.config.host}:${this.config.port}/${connDabase}`
                });
                this.eventListen(redisClient);
                this.log.info(`Connecting to Redis: redis://default:******@${this.config.host}:${this.config.port}/${connDabase}`);
                redisClient.connect().then((conn)=> {
                    this.clientStore[connDabase] = conn;
                    resolve(conn);
                }).catch((err) => {
                    this.log.error(err.stack);
                    reject(err);
                });
            } else {
                this.log.info("Use the connected redis client");
                resolve(this.clientStore[connDabase]);
            }
        });
    }
    private eventListen(client: RedisClientType<RedisDefaultModules>) {
        client.on("error", (err) => {
            console.error(err);
        });
        return () => {
            client.removeAllListeners();
        };
    }
}
