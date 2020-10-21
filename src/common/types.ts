export interface RedisCallback {
  (err: Error | null, key: string | null, value: any): void
}

export type EnvType = 'prod' | 'staging';

export type PodPhaseList = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
export type StorageStatus = 'Available' | 'Bound' | 'Released' | 'Failed';

export type ConditionType = 'Initialized' | 'Ready' | 'ContainersReady' | 'PodScheduled';

export type ListenMethodList = 'deploy' | 'redeploy' | 'undeploy'
 | 'createNamespace' | 'deleteNamespace'
 | 'createStorage' | 'deleteStorage'
 | 'createSecret';

export type workerListenMethod = {
  [type in ListenMethodList]: Function;
};

export type NodeInfo = {
  cpu: number;
  memory: number;
  gpu: number;
}

export type ClusterStatusParams = {
  clusterName: string;
  type: string;
  nodePool: {
    [nodePoolName: string]: {
      gpuType: string,
      osImage: string,
      nodes: {
        [nodeId: string]: {
          capacity: NodeInfo,
          allocatable: NodeInfo,
        }
      }
    }
  };
}

export type PodInfoParams = {
  podName: string;
  namespaceId: string;
  status: {
    phase: PodPhaseList;
    message?: string;
    startTime?:string;
    condition: {
      type: ConditionType;
      status: boolean;
      reason?: string;
      message?: string;
    }
  };
}
export type PodStatusParams = {
  clusterName: string;
  containerId: string;
  podId: string;
  podInfo: PodInfoParams;
}

export type StorageInfoParams = {
  status: StorageStatus;
}
export type StorageStatusParams = {
  clusterName: string;
  storageId: string;
  storageInfo: StorageInfoParams;
}

/* Types for Client */
export type RequestReturn<T> = {
  statusCode: string;
  result?: T;
  errMessage?: string;
  updatedAt: number;
}

export type DeployParams = {
  clusterName: string;
  namespaceId: string;
  deployTemplateName?: string
  containerInfo: {
    imageName: string;
    nodePoolName: string;
    storageSpec?: {
      [storageId: string]: {
        mountPath: string;
        subPath?: string;
        isSecret?: boolean;
      }
    }
    hwSpec: {
      cpu: number;
      memory: number;
      gpu: number;
    }
    replicas?: number;
    command?: string;
    env?: object;
    port: number[];
  }
  requestTimeout?: number;
  runningTimeout?: number;
}

export type DeployReturn = {
  clusterName: string;
  containerId: string;
  endpoint: {
    [post: string]: string
  };
}

export type RedeployParams = {
  clusterName: string;
  namespaceId: string;
  containerId: string;
  option?: {
    port?: number[];
    imageName?: string;
    replicas?: number;
    env?: object;
  }
}

export type UndeployParams = {
  clusterName: string;
  namespaceId: string;
  containerId: string;
}

export type CreateNamespaceParams = {
  clusterName: string;
}

export type CreateNamespaceReturn = {
  namespaceId: string;
}

export type DeleteNamespaceParams = {
  clusterName: string;
  namespaceId: string;
}

export type CreateStorageParams = {
  clusterName: string;
  namespaceId: string;
  capacity: string;
  subPath?: string;
  shared?: boolean;
}

export type CreateStorageReturn = {
  storageId: string;
}

export type DeleteStorageParams = {
  clusterName: string;
  namespaceId: string;
  storageId: string;
}

export type CreateSecretParams = {
  clusterName: string;
  namespaceId: string;
  name: string;
  type: string;
  data: {
    [key: string]: string
  };
}

/* getClusterList */
export type GetClusterListParams = {
  cpu: number;
  memory: number;
  gpu?: object;
}
export type GetClusterListReturn = {
  clusterName: string;
  type: string;
  nodePool: {
    [nodePoolName: string]: {
      gpuType: string,
      osImage: string,
      nodes: {
        [nodeId: string]: NodeInfo,
      }
    }
  };
}

export type StatusGetterReturn<T> = {
  updatedAt: number;
  status: T;
}

/* getClusterInfo */
export type GetClusterStatusParams = {
  clusterName: string;
}
export type GetClusterStatusReturn = ClusterStatusParams;

/* getContainerStatus */
export type GetContainerStatusParams = {
  clusterName: string;
  containerId: string;
}
export type GetContainerStatusReturn = {
  [podId: string]: StatusGetterReturn<PodInfoParams>;
}

/* getStorageStatus */
export type GetStorageStatusParams = {
  clusterName: string;
  storageId: string;
}
export type GetStorageStatusReturn = StorageInfoParams;
