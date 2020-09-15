import { ClientOpts } from 'redis';
import RedisClient from '../common/redis';
import * as Types from '../common/types';
import * as Error from '../common/error';

export default class Worker {
  private redisClient: RedisClient;

  private listenMethodList: Types.workerListenMethod;

  constructor(options: ClientOpts) {
    this.redisClient = new RedisClient(options);
  }

  public async getClusterInfo(clusterName: string) {
    return null;
  }

  public async listenClusterInfo(clusterName: string, callback: Function) {
    return null;
  }

  public async writePayload(payload: object, dbpath: string) {
    await this.redisClient.set(dbpath, payload);
  }

  public listenReqeust(clusterName: string, methods: types.workerListenMethod) {
    const pattern = `worker:request_queue:${clusterName}:*`;
    this.listenMethodList = methods;
    this.redisClient.on(pattern, async (err, key, value) => {
      const resPath = `${key}:response`;
      const { type, payload } = value;
      if (err) {
        await this.writePayload({
          statusCode: Error.STATUS_CODE.unexpected,
          errMessage: err,
        }, resPath);
      } else if (type && this.listenMethodList[type]) {
        // parse stringified payload
        const res = await this.listenMethodList[type](JSON.parse(payload));
        await this.writePayload({
          statusCode: Error.STATUS_CODE.success,
          result: JSON.stringify(res),
        }, resPath);
      } else {
        await this.writePayload({
          statusCode: Error.STATUS_CODE.invalidParams,
          errMessage: err,
        }, resPath);
      }
    });
    return null;
  }

  public async registerCluster(option: Types.ClusterRegisterParams) {
    return null;
  }

  public async updateClusterInfo(clusterName: string, allowAdress?: string[], price?: number) {
    return null;
  }
}
