export interface RedisCallback {
  (err: Error | null, key: string | null, value: any): void
}

export type EnvType = 'prod' | 'staging';

export type ListenMethodList = 'deploy' | 'redeploy' | 'undeploy'
 | 'createNamespace' | 'deleteNamespace'
 | 'createStorage' | 'deleteStorage'
 | 'getContainerInfo' | 'getClusterInfo';

export type workerListenMethod = {
  [type in ListenMethodList]: Function;
};

export type ClusterRegisterParams = {
  clusterName: string;
  clusterTitle: string;
  clusterDescription: string;
  type: string;
  endpointConfig?: {
    https: 0 | 1;
    domainName?: string
    ip?: string
    istio: 0 | 1;
  }
  nodePool?: {
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
  clusterName: string
  containerId: string
  endpoint: string
  storageId?: string
}

export type RedeployParams = {
  clusterName: string;
  namespaceId: string;
  containerId: string;
  option?: {
    port?: object;
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

export type GetContainerInfoParams = {
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
  clusterName: string;
}

export type GetClusterInfoReturn = {
  statusCode: number;
  clusterInfo: ClusterRegisterParams;
}
