export interface RedisCallback {
  (err: Error | null, key: string | null, value: any): void
}

export type EnvType = 'prod' | 'staging';
// sleep < failed < pending < createContainer < success
export type PodPhaseList = 'failed' | 'pending' | 'createContainer' | 'success';
export type StorageStatus = 'failed' | 'pending' | 'createStorage' | 'success';

export type ConditionType = 'Initialized' | 'Ready' | 'ContainersReady' | 'PodScheduled';

export type ListenMethodList = 'deploy' | 'redeploy' | 'undeploy'
 | 'createNamespace' | 'deleteNamespace'
 | 'createStorage' | 'deleteStorage'
 | 'createSecret' | 'getContainerLog'
 | 'putStorageToFtp' | 'getStorageFromFtp'
 | 'createSnapshotFromContainer' | 'getSnapshotStatus';

export type workerListenMethod = {
  [type in ListenMethodList]: Function;
};

export type NodeInfo = {
  cpu: number; // m
  memory: number; // Mi
  gpu: number;
}

/* Types for Worker */
/* setClusterStatus */
export type ClusterStatusParams = {
  clusterName: string;
  type: string;
  nodePool: {
    [nodePoolName: string]: {
      cpu: number, // m
      memory: number, // Mi
      gpuType: string,
      osImage: string,
      isAutoScaleEnabled: boolean,
      nodes: {
        [nodeId: string]: {
          capacity: NodeInfo,
          allocatable: NodeInfo,
        }
      }
    }
  };
}

export type ConditionError = {
  [type: string]: {
      reason?: string;
      message?: string;
  }
}

export declare type PodStatusParams = {
  podName: string;
  namespaceId: string;
  status: {
      phase: PodPhaseList;
      conditionError?: ConditionError;
  };
};

export type SetPodStatusParams = {
  clusterName: string;
  containerId: string;
  podId: string;
  podStatus: PodStatusParams;
}

/* setStorageStatus */
export type StorageStatusParams = {
  status: StorageStatus;
}
export type SetStorageStatusParams = {
  clusterName: string;
  storageId: string;
  storageStatus: StorageStatusParams;
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
  deployTemplateName?: string;
  maxDuration?: number;
  containerInfo: {
    imageName: string;
    isNodePort?: boolean;
    nodePoolName: string;
    storageSpec?: {
      [storageId: string]: {
        mountPath: string;
      }
    }
    secretSpec?: {
      [secretId: string]: {
        mountPath: string;
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
  nodePort?: {
    clusterIp: string;
    hostIp: string;
    port: {
      [port: string]: number
    };
  };
  endpoint: {
    [port: string]: string
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
  capacity: number; // Gi
  sharedNfs?: {
    ip: string;
    basePath: string;
  }
}

export type CreateStorageReturn = {
  storageId: string;
  nfsInfo?: {
    ip: string;
    basePath: string;
  }
}

export type DeleteStorageParams = {
  clusterName: string;
  namespaceId: string;
  storageId: string;
  isSharedNfs: boolean;
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

export type PutStorageToFtpParams = {
  clusterName: string;
  namespaceId: string;
  storageId: string;
  toStorageId: string;
  timestamp: string;
}

export type GetStorageFromFtpParams = {
  clusterName: string;
  namespaceId: string;
  storageId: string;
  timestamp: string;
}

export type GetContainerLogParams = {
  clusterName: string;
  namespaceId: string;
  containerId: string;
  fromTimestamp?: number;
}
export type GetContainerLogReturn = {
  log: string;
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
      isAutoScaleEnabled: boolean,
      nodes?: {
        [nodeId: string]: {
          capacity: NodeInfo,
          allocatable: NodeInfo,
        }
      }
    }
  };
  updatedAt: number;
}

export type StatusGetterReturn<T> = {
  updatedAt: number;
  status: T;
} | null;

/* getClusterStatus */
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
  containerStatus: PodPhaseList;
} | null;

/* getStorageStatus */
export type GetStorageStatusParams = {
  clusterName: string;
  storageId: string;
}
export type GetStorageStatusReturn = StorageStatusParams;

/* createSnapshotFromContainer */
export type CreateSnapshotFromContainerParams = {
  clusterName: string;
  namespaceId: string;
  containerId: string;
  userId: string;
  resultImagePrefix?: string;
  webhook?: string;
}
export type CreateSnapshotFromContainerReturn = {
  snapshotJobName: string;
  snapshotJobStatus: string;
  snapshotDockerImageUri?: string;
} | null;

/* getSnapshotStatus */
export type GetSnapshotStatusParams = {
  clusterName: string;
  snapshotJobName: string;
}
export type GetSnapshotStatusReturn = CreateSnapshotFromContainerReturn;