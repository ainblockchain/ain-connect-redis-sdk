import { customAlphabet } from 'nanoid';
import { ClientOpts } from 'redis';
import * as Types from '../common/types';
import RedisClient from './redis';
import * as Error from '../common/error';

const PodPhasePriority = {
  failed: 1,
  pending: 2,
  createContainer: 3,
  success: 4,
};

function getRandomRequestId() {
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 25);
  return nanoid();
}

export default class Client {
  private redisClient: RedisClient;

  constructor(options?: ClientOpts) {
    this.redisClient = new RedisClient(options);
  }

  private async sendRequest(type: string, params: any)
    : Promise<Types.RequestReturn<any>> {
    const requestId = getRandomRequestId();
    const { clusterName } = params;
    const key = `worker:request_queue:${clusterName}:${requestId}`;
    const responseKey = `worker:response:${clusterName}:${requestId}`;
    // write payload as stringified form
    const value = { type, updatedAt: Date.now(), payload: JSON.stringify(params) };
    const reply = await this.redisClient.once(key, value, responseKey);
    if (reply.statusCode === Error.STATUS_CODE.success) {
      return {
        statusCode: Error.STATUS_CODE.success,
        result: JSON.parse(reply.result),
        updatedAt: reply.updatedAt,
      };
    }

    return {
      statusCode: reply.statusCode,
      errMessage: reply.errMessage,
      updatedAt: reply.updatedAt,
    };
  }

  public unref() {
    this.redisClient.unref();
  }

  /* Deployment */
  public async deploy(params: Types.DeployParams)
    : Promise<Types.RequestReturn<Types.DeployReturn>> {
    const res = await this.sendRequest('deploy', params);
    return res;
  }

  public async redeploy(params: Types.RedeployParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('redeploy', params);
    return res;
  }

  public async undeploy(params: Types.UndeployParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('undeploy', params);
    return res;
  }

  /* Namespace */
  public async createNamespace(params: Types.CreateNamespaceParams)
    : Promise<Types.RequestReturn<Types.CreateNamespaceReturn>> {
    const res = await this.sendRequest('createNamespace', params);
    return res;
  }

  public async deleteNamespace(params: Types.DeleteNamespaceParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('deleteNamespace', params);
    return res;
  }

  /* Storage */
  public async createStorage(params: Types.CreateStorageParams)
    : Promise<Types.RequestReturn<Types.CreateStorageReturn>> {
    const res = await this.sendRequest('createStorage', params);
    return res;
  }

  public async deleteStorage(params: Types.DeleteStorageParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('deleteStorage', params);
    return res;
  }

  /* Secret */
  public async createSecret(params: Types.CreateSecretParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('createSecret', params);
    return res;
  }

  /* FTP */
  public async putStorageToFtp(params: Types.PutStorageToFtpParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('putStorageToFtp', params);
    return res;
  }

  public async getStorageFromFtp(params: Types.GetStorageFromFtpParams)
    : Promise<Types.RequestReturn<null>> {
    const res = await this.sendRequest('getStorageFromFtp', params);
    return res;
  }

  /* Container Log */
  public async getContainerLog(params: Types.GetContainerLogParams)
    : Promise<Types.RequestReturn<Types.GetContainerLogReturn>> {
    const res = await this.sendRequest('getContainerLog', params);
    return res;
  }

  public async getClusterList(params?: Types.GetClusterListParams)
    : Promise<Types.GetClusterListReturn[]> {
    const keys = await this.redisClient.keys('worker:info:*');
    const available: any[] = [];
    const scalable: any[] = [];
    for (const key of keys) {
      const value = await this.redisClient.get(key);
      const status = JSON.parse(value.status);

      const targetNodePool = {};
      const scalableNodePool = {};
      const nodePoolNames = Object.keys(status.nodePool);
      for (const nodePoolName of nodePoolNames) {
        // params.gpu format: {'v100': 1}
        const targetNode = {};
        const nodePool = status.nodePool[nodePoolName];
        let matched = false;
        if (!params
          || (!params.gpu && nodePool.gpuType === '')
          || (params.gpu && params.gpu[nodePool.gpuType] !== undefined)) {
          matched = true;
          const nodeIds = Object.keys(nodePool.nodes);
          for (const nodeId of nodeIds) {
            const node = nodePool.nodes[nodeId];
            if (!params
                || (
                  (!params.gpu || node.allocatable.gpu >= params.gpu[nodePool.gpuType])
                  && node.allocatable.cpu >= params.cpu
                  && node.allocatable.memory >= params.memory
                )
            ) {
              targetNode[nodeId] = node;
            }
          }
        }
        if (Object.keys(targetNode).length !== 0) {
          targetNodePool[nodePoolName] = {
            cpu: nodePool.cpu,
            memory: nodePool.memory,
            gpuType: nodePool.gpuType,
            osImage: nodePool.osImage,
            isAutoScaleEnabled: nodePool.isAutoScaleEnabled,
            nodes: targetNode,
          };
        } else if (matched && nodePool.isAutoScaleEnabled
          && (!params
            || (nodePool.cpu >= params.cpu
              && nodePool.memory >= params.memory))) {
          // no available node, but nodePool is scalable
          scalableNodePool[nodePoolName] = {
            cpu: nodePool.cpu,
            memory: nodePool.memory,
            gpuType: nodePool.gpuType,
            osImage: nodePool.osImage,
            isAutoScaleEnabled: nodePool.isAutoScaleEnabled,
          };
        }
      }

      if (Object.keys(targetNodePool).length !== 0) {
        available.push({
          updatedAt: value.updatedAt,
          clusterName: status.clusterName,
          type: status.type,
          nodePool: targetNodePool,
        });
      }

      if (Object.keys(scalableNodePool).length !== 0) {
        scalable.push({
          updatedAt: value.updatedAt,
          clusterName: status.clusterName,
          type: status.type,
          nodePool: scalableNodePool,
        });
      }
    }
    // available first, scalable later
    return [...available, ...scalable];
  }

  public async getClusterStatus(params: Types.GetClusterStatusParams)
    : Promise<Types.StatusGetterReturn<Types.GetClusterStatusReturn>> {
    const statusPath = `worker:info:${params.clusterName}`;
    const res = await this.redisClient.get(statusPath);
    /* parse stringified property in setClusterStatus() */
    if (res) {
      res.status = JSON.parse(res.status);
      return res;
    }
    return null;
  }

  public async getContainerStatus(params: Types.GetContainerStatusParams)
    : Promise<Types.GetContainerStatusReturn> {
    const pattern = `container:${params.clusterName}:${params.containerId}:*`;
    const keys = await this.redisClient.keys(pattern);
    let curStatus: Types.PodPhaseList = 'failed';
    if (keys.length !== 0) {
      for (const key of keys) {
        const value = await this.redisClient.get(key);
        /* parse stringified property in setPodStatus() */
        if (value.status) {
          value.status = JSON.parse(value.status);
          if (PodPhasePriority[curStatus] < PodPhasePriority[value.status.status.phase]) {
            curStatus = value.status.status.phase;
          }
        }
      }
      return { containerStatus: curStatus };
    }
    return null;
  }

  public async getStorageStatus(params: Types.GetStorageStatusParams)
    : Promise<Types.StatusGetterReturn<Types.GetStorageStatusReturn>> {
    const statusPath = `storage:${params.clusterName}:${params.storageId}`;
    const res = await this.redisClient.get(statusPath);
    if (res) {
      res.status = JSON.parse(res.status);
      return res;
    }
    return null;
  }

  public async createSnapshotFromContainer(params: Types.CreateSnapshotFromContainerParams)
    : Promise<Types.RequestReturn<Types.CreateSnapshotFromContainerReturn>> {
      return await this.sendRequest('createSnapshotFromContainer', params);
    }

  public async getSnapshotStatus(params: Types.GetSnapshotStatusParams)
  : Promise<Types.RequestReturn<Types.GetSnapshotStatusReturn>> {
    return await this.sendRequest('getSnapshotStatus', params);
  }
}
