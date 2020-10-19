export interface RedisCallback {
  (err: Error | null, key: string | null, value: any): void
}

export type EnvType = 'prod' | 'staging';

export type PodStatus = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
export type StorageStatus = 'pending' | 'createStorage' | 'success' | 'failed' | 'on-migration';

export type ConditionType = 'Initialized' | 'Ready' | 'ContainersReady' | 'PodScheduled';

export type ListenMethodList = 'deploy' | 'redeploy' | 'undeploy'
 | 'createNamespace' | 'deleteNamespace'
 | 'createStorage' | 'deleteStorage'
 | 'createSecret';

export type workerListenMethod = {
  [type in ListenMethodList]: Function;
};

export type PodInfoParams = {
  podName: string;
  namespaceId: string;
  status: {
    phase: PodStatus;
    message?: string;
    startTime?:string;
    condition: {
      type: ConditionType;
      status: boolean;
      reason?: string;
      message?: string;
    }
  }
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
          capacity: {
            cpu: string,
            memory: string
            gpu: string,
          },
          allocatable: {
            cpu: string,
            memory: string
            gpu: string,
          }
        }
      }
    }
  };
}

export type PodStatusParams = {
  clusterName: string;
  containerId: string;
  podId: string;
  podInfo: PodInfoParams;
}

export type StorageStatusParams = {
  clusterName: string;
  storageId: string;
  storageInfo: {
    status: StorageStatus;
  }
}

export type DeployParams = {
  clusterName?: string;
  namespaceId: string;
  deployTemplateName?: string
  selectClusterOption?: {
    isSingleNode: boolean;
    isPrivate: boolean;
    https: boolean;
    istio: boolean;
    hwSpec: {
      isGpu?: boolean;
      isStorage?: boolean;
    };
  }
  containerInfo: {
    imageName: string;
    nodePoolName?: string;
    storageSpec?: {
      name: string;
      mountPath: string;
      subPath?: string;
      isSecret?: boolean;
    }
    hwSpec: {
      cpuPerCore: number;
      memoryPerGb: number;
      gpu: number;
      storagePerGb?: number;
    }
    replicas?: number;
    command?: string;
    env?: object;
    port: number[];
  }
  requestTimeout?: number;
  runningTimeout?: number;
}

/* Types for Client */
export type RequestReturn<T> = {
  statusCode: number;
  result?: T;
  errMessage?: string;
}

export type DeployReturn = {
  clusterName: string;
  containerId: string;
  endpoint: {
    [post: string]: string
  };
  storageId?: string;
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
  namespaceId: string;
  name: string;
  type: string;
  data: {
    [key: string]: string
  };
}

export type GetClusterInfoParams = {
  clusterName: string;
}

export type GetClusterInfoReturn = ClusterStatusParams;

export type GetContainerInfoParams = {
  clusterName: string;
  containerId: string;
}

export type GetContainerInfoReturn = {
  [podId: string]: PodInfoParams;
}

export type GetStorageInfoParams = {
  clusterName: string;
  storageId: string;
}

export type GetStorageInfoReturn = {
  status: StorageStatus;
}
