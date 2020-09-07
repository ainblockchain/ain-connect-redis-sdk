import redis from 'redis';
import * as types from '../common/types';
import * as error from '../common/error';

export default class Worker {
  private redisClient: redis.RedisClient;

  private listenMethodList: types.workerListenMethod;

  constructor(url: string, options?: redis.ClientOpts) {
    this.redisClient = redis.createClient(url, options);
  }

  public async getClusterInfo(clusterName: string) {
    return null;
  }

  public async listenClusterInfo(clusterName: string, callback: Function) {
    return null;
  }

  public async writePayload(payload: object, dbpath: string) {
    return null;
  }

  public listenReqeust(clusterName: string, methods: types.workerListenMethod) {
    this.listenMethodList = methods;
    return null;
  }

  public async registerCluster(option: types.ClusterRegisterParams) {
    return null;
  }

  public async updateClusterInfo(clusterName: string, allowAdress?: string[], price?: number) {
    return null;
  }
}
