import { customAlphabet } from 'nanoid';
import { ClientOpts } from 'redis';
import * as types from '../common/types';
import RedisClient from './redis';
import * as Error from '../common/error';

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return nanoid();
}

export default class Client {
  private redisClient: RedisClient;

  constructor(options: ClientOpts) {
    this.redisClient = new RedisClient(options);
  }

  private async sendRequest(type: string, params: any) {
    const requestId = getRandomRequestId();
    const { clusterName } = params;
    const key = `worker:request_queue:${clusterName}:${requestId}`;
    // write payload as stringified form
    const value = { type, payload: JSON.stringify(params) };
    await this.redisClient.set(key, value);
    const reply = await this.redisClient.once(`${key}:response`);
    if (reply.statusCode === Error.STATUS_CODE.success) {
      return {
        statusCode: Error.STATUS_CODE.success,
        result: JSON.parse(reply.result),
      };
    }

    return {
      statusCode: reply.statusCode,
      errMessage: reply.errMessage,
    };
  }

  public async deploy(params: types.DeployParams) {
    const res = await this.sendRequest('deploy', params);
    return res;
  }

  public async redeploy(params: types.RedeployParams) {
    const res = await this.sendRequest('redeploy', params);
    return res;
  }

  public async createStorage(params: types.CreateStorageParams) {
    const res = await this.sendRequest('createStorage', params);
    return res;
  }

  public async deleteStorage(params: types.DeleteStorageParams) {
    const res = await this.sendRequest('deleteStorage', params);
    return res;
  }

  public async getContainerInfo(params: types.GetContainerInfoParams) {
    const res = await this.sendRequest('getContainerConfig', params);
    return res;
  }

  public async execKubeCtl(params: any) {
    const res = await this.sendRequest('execKubeCtl', params);
    return res;
  }
}
