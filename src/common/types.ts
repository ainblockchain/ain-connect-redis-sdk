export interface RedisCallback {
  (err: Error | null, key: string | null, value: any): void
}

export type EnvType = 'prod' | 'staging';

export type ListenMethodList = 'deploy' | 'redeploy' | 'undeploy'
 | 'createStorage' | 'deleteStorage' | 'getContainerInfo' | 'getClusterInfo' | 'getClusterList';

export type workerListenMethod = {
  [type in ListenMethodList]: Function;
};

export type ClusterRegisterParams = {
  address: string;
  clusterName: string;
  clusterTitle: string;
  clusterDescription: string;
  isSingleNode: 0 | 1;
  isPrivate: 0 | 1;
  allowAddressList?: string[]
  endpointConfig: {
    https: 0 | 1;
    domainName?: string
    ip?: string
    istio: 0 | 1;
  }
  nodePool: {
    nodePoolName: string
    hwConfig: {
      gpu: 0 | 1;
      storage: 0 | 1;
    }
    priceConfig: {
      cpuPerCore: number;
      memoryPerGb: number;
      gpu: number;
      storagePerGb: number;
    }
  }
}

export type DeployParams = {
  targetAddress?: string;
  clusterName?: string;
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
    storageId?: string;
    imageRegistryLoginInfo?: {
      url: string;
      id: string;
      pw: string;
    };
    hwSpec: {
      cpuPerCore: number;
      memoryPerGb: number;
      gpu: number;
      storagePerGb?: number;
    }
    replicas?: number;
    command?: string;
    env?: object;
    port: object;
  }
  requestTimeout?: number;
  runningTimeout?: number;
}

export type DeployReturn = {
  statusCode: number
  targetAddress: string
  clusterName: string
  containerId: string
  endpoint: string
  storageId?: string
}

export type RedeployParams = {
  statusCode: number;
  targetAddress: string;
  clusterName: string;
  containerId: string;
  option?: {
    port?: object;
    replicas?: number;
    env?: object;
  }
}

export type UndeployParams = {
  targetAddress: string;
  clusterName: string;
  containerId: string;
}

export type CreateStorageParams = {
  targetAddress: string;
  clusterName: string;
  storagePerGb: number;
}

export type CreateStorageReturn = {
  statusCode: number;
  storageId: string;
}

export type DeleteStorageParams = {
  targetAddress: string;
  clusterName: string;
  storageId: string;
}

export type GetContainerInfoParams = {
  targetAddress: string;
  clusterName: string;
  containerId: string;
}

export type GetContainerInfoReturn = {
  statusCode: number
  containerImage: string
  port: object;
  env?: object;
  command?: string;
  resourceStatus: number;
}

export type GetClusterInfoParams = {
  targetAddress: string;
  clusterName: string;
}

export type GetClusterInfoReturn = {
  statusCode: number;
  clusterInfo: ClusterRegisterParams;
}
