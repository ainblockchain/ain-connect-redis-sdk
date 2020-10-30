import { ClientOpts } from 'redis';
import { promisify } from 'util';
import RedisClient from './redis';
import * as Types from '../common/types';
import * as Error from '../common/error';

export default class Worker {
  private redisClient: RedisClient;

  private listenMethodList: Types.workerListenMethod;

  constructor(options?: ClientOpts) {
    this.redisClient = new RedisClient(options);
  }

  public async writeResponse(response: object, dbpath: string) {
    const timeResponse = { updatedAt: Date.now(), ...response };
    await this.redisClient.set(dbpath, timeResponse);
  }

  public async timeoutUnhandledRequest(clusterName: string, curTime: number) {
    const redis = this.redisClient.getClient();
    const scan = promisify(redis.scan).bind(redis);
    const pattern = `worker:request_queue:${clusterName}:*`;
    let cursor = '0';
    do {
      const res = await scan(cursor, 'MATCH', pattern);
      const [nextCursor, curKeys] = res;
      cursor = nextCursor;

      for (const key of curKeys) {
        const requestId = key.split(':')[3];
        const resKey = `worker:response:${clusterName}:${requestId}`;
        const response = await this.redisClient.get(resKey);
        if (!response) {
          // unhandled request
          await this.writeResponse({
            statusCode: Error.STATUS_CODE.unhandledRequest,
            errMessage: 'request timeout',
          }, resKey);
        }
      }
    } while (cursor !== '0');
  }

  public listenRequest(clusterName: string, methods: Types.workerListenMethod) {
    const pattern = `worker:request_queue:${clusterName}:*`;
    this.listenMethodList = methods;
    const curTime = Date.now();
    this.redisClient.on(pattern, async (err, key, value) => {
      const requestId = key?.split(':')[3];
      const resPath = `worker:response:${clusterName}:${requestId}`;
      const { type, payload } = value;
      if (err) {
        await this.writeResponse({
          statusCode: Error.STATUS_CODE.unexpected,
          errMessage: err,
        }, resPath);
      } else if (type && this.listenMethodList[type]) {
        // parse stringified payload
        try {
          const res = await this.listenMethodList[type](JSON.parse(payload));
          await this.writeResponse({
            statusCode: Error.STATUS_CODE.success,
            result: JSON.stringify(res),
          }, resPath);
        } catch (e) {
          await this.writeResponse({
            statusCode: e.statusCode,
            errMessage: e.errMessage,
          }, resPath);
        }
      } else {
        await this.writeResponse({
          statusCode: Error.STATUS_CODE.invalidParams,
          errMessage: 'invalid type',
        }, resPath);
      }
    });
    this.timeoutUnhandledRequest(clusterName, curTime);
  }

  public async writeStatus(status: object, dbpath: string) {
    const timePayload = {
      updatedAt: Date.now(),
      status: JSON.stringify(status),
    };
    await this.redisClient.set(dbpath, timePayload);
  }

  public async setClusterStatus(status: Types.ClusterStatusParams) {
    await this.writeStatus(status, `worker:info:${status.clusterName}`);
  }

  public async deleteClusterStatus(clusterName: string) {
    await this.redisClient.del(`worker:info:${clusterName}`);
  }

  public async setPodStatus(status: Types.SetPodStatusParams) {
    const { clusterName, containerId, podId } = status;
    const key = `container:${clusterName}:${containerId}:${podId}`;
    await this.writeStatus(status.podStatus, key);
  }

  public async deletePodStatus(clusterName: string, containerId: string, podId: string) {
    const key = `container:${clusterName}:${containerId}:${podId}`;
    await this.redisClient.del(key);
  }

  public async setStorageStatus(status: Types.SetStorageStatusParams) {
    const key = `storage:${status.clusterName}:${status.storageId}`;
    await this.writeStatus(status.storageStatus, key);
  }

  public async deleteStorageStatus(clusterName: string, storageId: string) {
    const key = `storage:${clusterName}:${storageId}`;
    await this.redisClient.del(key);
  }

  public async getAllContainers(clusterName: string) {
    const keys = await this.redisClient.keys(`container:${clusterName}:*`);
    const res = {};
    for (const key of keys) {
      const value = await this.redisClient.get(key);
      res[key] = {
        updatedAt: value.updatedAt,
        status: JSON.parse(value.status),
      };
    }

    return res;
  }

  public async getAllStorages(clusterName: string) {
    const keys = await this.redisClient.keys(`storage:${clusterName}:*`);
    const res = {};
    for (const key of keys) {
      const value = await this.redisClient.get(key);
      res[key] = {
        updatedAt: value.updatedAt,
        status: JSON.parse(value.status),
      };
    }

    return res;
  }
}
