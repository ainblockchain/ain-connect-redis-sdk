import { ClientOpts } from 'redis';
import RedisClient from './redis';
import * as Types from '../common/types';
import * as Error from '../common/error';

export default class Worker {
  private redisClient: RedisClient;

  private listenMethodList: Types.workerListenMethod;

  constructor(options?: ClientOpts) {
    this.redisClient = new RedisClient(options);
  }

  public async writePayload(payload: object, dbpath: string) {
    const timePayload = { updatedAt: Date.now(), ...payload };
    await this.redisClient.set(dbpath, timePayload);
  }

  public listenRequest(clusterName: string, methods: Types.workerListenMethod) {
    const pattern = `worker:request_queue:${clusterName}:*`;
    this.listenMethodList = methods;
    this.redisClient.on(pattern, async (err, key, value) => {
      const requestId = key?.split(':')[3];
      const resPath = `worker:response:${clusterName}:${requestId}`;
      const { type, payload } = value;
      if (err) {
        await this.writePayload({
          statusCode: Error.STATUS_CODE.unexpected,
          errMessage: err,
        }, resPath);
      } else if (type && this.listenMethodList[type]) {
        // parse stringified payload
        try {
          const res = await this.listenMethodList[type](JSON.parse(payload));
          await this.writePayload({
            statusCode: Error.STATUS_CODE.success,
            result: JSON.stringify(res),
          }, resPath);
        } catch (e) {
          await this.writePayload({
            statusCode: e.statusCode,
            errMessage: e.errMessage,
          }, resPath);
        }
      } else {
        await this.writePayload({
          statusCode: Error.STATUS_CODE.invalidParams,
          errMessage: 'invalid type',
        }, resPath);
      }
    });
    return null;
  }

  public async setClusterStatus(option: Types.ClusterStatusParams) {
    const newOption: any = option;
    newOption.nodePool = JSON.stringify(option.nodePool);
    await this.writePayload(option, `worker:info:${option.clusterName}`);
  }

  public async deleteClusterStatus(clusterName: string) {
    await this.redisClient.del(`worker:info:${clusterName}`);
  }

  public async setPodStatus(option: Types.PodStatusParams) {
    const key = `container:${option.clusterName}:${option.containerId}:${option.podId}`;
    const newPodInfo: any = option.podInfo;
    newPodInfo.status = JSON.stringify(option.podInfo.status);
    await this.writePayload(newPodInfo, key);
  }

  public async deletePodStatus(clusterName: string, containerId: string, podId: string) {
    const key = `container:${clusterName}:${containerId}:${podId}`;
    await this.redisClient.del(key);
  }

  public async setStorageStatus(option: Types.StorageStatusParams) {
    const key = `storage:${option.clusterName}:${option.storageId}`;
    await this.writePayload(option.storageInfo, key);
  }

  public async deleteStorageStatus(clusterName: string, storageId: string) {
    const key = `storage:${clusterName}:${storageId}`;
    await this.redisClient.del(key);
  }
}
