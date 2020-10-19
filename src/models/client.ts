import { customAlphabet } from 'nanoid';
import { ClientOpts } from 'redis';
import * as Types from '../common/types';
import RedisClient from './redis';
import * as Error from '../common/error';

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return nanoid();
}

export default class Client {
  private redisClient: RedisClient;

  constructor(options?: ClientOpts) {
    this.redisClient = new RedisClient(options);
  }

  private async sendRequest(type: string, params: any) {
    const requestId = getRandomRequestId();
    const { clusterName } = params;
    const key = `worker:request_queue:${clusterName}:${requestId}`;
    const responseKey = `worker:response:${clusterName}:${requestId}`;
    // write payload as stringified form
    const value = { type, payload: JSON.stringify(params) };
    await this.redisClient.set(key, value);
    const reply = await this.redisClient.once(responseKey);
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

  public unref() {
    this.redisClient.unref();
  }

  public async deploy(params: Types.DeployParams) {
    const res = await this.sendRequest('deploy', params);
    return res;
  }

  public async redeploy(params: Types.RedeployParams) {
    const res = await this.sendRequest('redeploy', params);
    return res;
  }

  public async undeploy(params: Types.UndeployParams) {
    const res = await this.sendRequest('undeploy', params);
    return res;
  }

  public async createNamespace(params: Types.CreateNamespaceParams) {
    const res = await this.sendRequest('createNamespace', params);
    return res;
  }

  public async deleteNamespace(params: Types.DeleteNamespaceParams) {
    const res = await this.sendRequest('deleteNamespace', params);
    return res;
  }

  public async createStorage(params: Types.CreateStorageParams) {
    const res = await this.sendRequest('createStorage', params);
    return res;
  }

  public async deleteStorage(params: Types.DeleteStorageParams) {
    const res = await this.sendRequest('deleteStorage', params);
    return res;
  }

  public async getClusterList() {
    const keys = await this.redisClient.keys('worker:info:*');
    const res: any[] = [];
    for (const key of keys) {
      const value = await this.redisClient.get(key);
      res.push({ name: value.clusterName, type: value.type });
    }
    return res;
  }

  public async getClusterInfo(params: Types.GetClusterInfoParams)
    : Promise<Types.GetClusterInfoParams> {
    const infoPath = `worker:info:${params.clusterName}`;
    const res = await this.redisClient.get(infoPath);
    return res;
  }

  public async getContainerInfo(params: Types.GetContainerInfoParams)
    : Promise<Types.GetContainerInfoReturn> {
    const infoPath = `container:${params.clusterName}:${params.containerId}`;
    const res = await this.redisClient.get(infoPath);
    return res;
  }

  public async getStorageInfo(params: Types.GetStorageInfoParams)
    : Promise<Types.GetStorageInfoReturn> {
    const infoPath = `stroage:${params.clusterName}:${params.storageId}`;
    const res = await this.redisClient.get(infoPath);
    return res;
  }
}
