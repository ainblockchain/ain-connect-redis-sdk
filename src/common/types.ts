export interface RedisCallback {
  (err: Error | null, key: string | null, value: any): void
}

export type EnvType = 'prod' | 'staging';

export type PhaseList = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';

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
    phase: PhaseList;
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
  endpointConfig?: {
    https: 0 | 1;
    domainName?: string
    ip?: string
    istio: 0 | 1;
  };
  nodePool: {
    [nodePoolName: string]: {
      gpuType: string,
      osImage: string,
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
  };
}

export type PodStatusParmas = {
  clusterName: string;
  containerId: string;
  podId: string;
  podInfo: PodInfoParams;
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

export type DeployReturn = {
  statusCode: number;
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

export type DeleteNamespaceParams = {
  clusterName: string;
  namespaceId: string;
}

export type CreateStorageParams = {
  clusterName: string;
  namespaceId: string;
  storagePerGb: number;
  subPath?: string;
}

export type CreateStorageReturn = {
  statusCode: number;
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
  phase: string;
}
