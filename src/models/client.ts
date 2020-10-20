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

  private async sendRequest(type: string, params: any)
    : Promise<Types.RequestReturn<any>> {
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

  public async getClusterList(params?: Types.GetClusterListParams)
    : Promise<Types.GetClusterListReturn[]> {
    const keys = await this.redisClient.keys('worker:info:*');
    const res: any[] = [];
    for (const key of keys) {
      const value = await this.redisClient.get(key);
      if (value.nodePool) {
        value.nodePool = JSON.parse(value.nodePool);
      }

      const targetNodePool = {};
      const nodePoolNames = Object.keys(value.nodePool);
      for (const nodePoolName of nodePoolNames) {
        // params.gpu format: {'v100': 1}
        const targetNode = {};
        const nodePool = value.nodePool[nodePoolName];
        if (!params
          || (!params.gpu && nodePool.gpuType === '')
          || (params.gpu && params.gpu[nodePool.gpuType])) {
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
              targetNode[nodeId] = node.allocatable;
            }
          }
        }
        if (Object.keys(targetNode).length !== 0) {
          targetNodePool[nodePoolName] = {
            gpuType: nodePool.gpuType,
            osImage: nodePool.osImage,
            node: targetNode,
          };
        }
      }

      if (Object.keys(targetNodePool).length !== 0) {
        res.push({
          clusterName: value.clusterName,
          type: value.type,
          nodePool: targetNodePool,
        });
      }
    }
    return res;
  }

  public async getClusterInfo(params: Types.GetClusterInfoParams)
    : Promise<Types.ClusterStatusParams> {
    const infoPath = `worker:info:${params.clusterName}`;
    const res = await this.redisClient.get(infoPath);
    /* parse stringified property in setClusterStatus() */
    if (res.nodePool) {
      res.nodePool = JSON.parse(res.nodePool);
    }
    return res;
  }

  public async getContainerInfo(params: Types.GetContainerInfoParams)
    : Promise<Types.GetContainerInfoReturn> {
    const pattern = `container:${params.clusterName}:${params.containerId}:*`;
    const keys = await this.redisClient.keys(pattern);
    const res = {};
    for (const key of keys) {
      const value = await this.redisClient.get(key);
      const podId = key.split(':')[3];
      /* parse stringified property in addPodInfo() */
      if (value.status) {
        value.status = JSON.parse(value.status);
      }
      res[podId] = value;
    }
    return res;
  }

  public async getStorageInfo(params: Types.GetStorageInfoParams)
    : Promise<Types.GetStorageInfoReturn> {
    const infoPath = `stroage:${params.clusterName}:${params.storageId}`;
    const res = await this.redisClient.get(infoPath);
    return res;
  }
}
