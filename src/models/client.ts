import redis from 'redis';
import { customAlphabet } from 'nanoid';
import * as types from '../common/types';

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return nanoid();
}

export default class Client {
  private redisClient: redis.RedisClient;

  constructor(url: string, options?: redis.ClientOpts) {
    this.redisClient = redis.createClient(url, options);
    // Redis Keyspace Notifications: https://redis.io/topics/notifications
    this.redisClient.config('set', 'notify-keyspace-events', 'KEA');
  }

  private async listenKey() {
    return new Promise((resolve, reject) => {
      this.redisClient.subscribe('__keyevent@0__:set', 'response_key');
      this.redisClient.on('message', (channel, key) => {
        this.redisClient.unsubscribe('__keyevent@0__:set', 'response_key');
      });
    });
  }

  public async deploy(params: types.DeployParams) {
    const requestId = getRandomRequestId();
    return requestId;
  }

  public async redeploy(params: types.RedeployParams) {
    return null;
  }

  public async createStorage(params: types.CreateStorageParams) {
    return null;
  }

  public async deleteStorage(params: types.DeleteStorageParams) {
    return null;
  }

  public async getContainerConfig(params: types.GetContainerInfoParams) {
    return null;
  }

  public async execKubeCtl(params: any) {
    return null;
  }

  public async getClusterInfo(params: types.GetClusterInfoParams) {
    return null;
  }

  public async getClusterList(params: types.GetClusterListParams) {
    return null;
  }

  public async getHistory(params: types.GetHistoryParams) {
    return null;
  }
}
