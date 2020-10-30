import AsyncRedis from 'async-redis';
import Client from '../../models/client';

let redis: any;
let client: Client;

describe('client', () => {
  beforeAll(async () => {
    // need local redis server for test
    redis = AsyncRedis.createClient();
    client = new Client();
    const nodePool1 = {
      nodePool1: {
        gpuType: 'v100',
        osImage: 'ubuntu18.04',
        nodes: {
          node1: {
            capacity: {
              cpu: 3920,
              memory: 15432,
              gpu: 1,
            },
            allocatable: {
              cpu: 1920,
              memory: 10152,
              gpu: 1,
            },
          },
        },
      },
    };
    const nodePool2 = {
      nodePool2: {
        gpuType: 'titanx',
        osImage: 'ubuntu20.04',
        nodes: {
          node1: {
            capacity: {
              cpu: '300',
              memory: '10000',
              gpu: 4,
            },
            allocatable: {
              cpu: '200',
              memory: '5000',
              gpu: 2,
            },
          },
        },
      },
    };
    await redis.hmset('worker:info:cluster-1', {
      updatedAt: 50,
      status: JSON.stringify({
        clusterName: 'cluster-1',
        type: 'aws',
        nodePool: nodePool1,
      }),
    });
    await redis.hmset('worker:info:cluster-2', {
      updatedAt: 100,
      status: JSON.stringify({
        clusterName: 'cluster-2',
        type: 'gcp',
        nodePool: nodePool2,
      }),
    });
    await redis.hmset('container:cluster-1:container1:pod1', {
      updatedAt: 100,
      status: JSON.stringify({
        podName: 'pod1',
        namespaceId: 'namespace1',
        status: {
          phase: 'success',
          startTime: 'Thu Oct 29 2020 14:16:32 GMT+0000 (Coordinated Universal Time)',
          condition: {
            type: 'Initialized',
            status: true,
          },
        },
      }),
    });
    await redis.hmset('container:cluster-1:container1:pod2', {
      updatedAt: 100,
      status: JSON.stringify({
        podName: 'pod2',
        namespaceId: 'namespace2',
        status: {
          phase: 'pending',
          startTime: 'Thu Oct 30 2020 14:16:32 GMT+0000 (Coordinated Universal Time)',
          condition: {
            type: 'Initialized',
            status: true,
          },
        },
      }),
    });
  });

  afterAll((done) => {
    redis.unref();
    client.unref();
    done();
  });

  it('get cluster list', async () => {
    const list = await client.getClusterList();
    expect(list.length).toEqual(2);
  });

  it('get specific cluster list', async () => {
    const list = await client.getClusterList({
      cpu: 1800,
      memory: 1000,
      gpu: { v100: 1 },
    });
    expect(list.length).toEqual(1);
  });

  it('get cluster without gpu option', async () => {
    const list = await client.getClusterList({
      cpu: 100,
      memory: 1000,
    });
    expect(list.length).toEqual(0);
  });

  it('no satisfied cluster', async () => {
    const list = await client.getClusterList({
      cpu: 500,
      memory: 20000,
      gpu: { v100: 1 },
    });
    expect(list.length).toEqual(0);
  });

  it('get cluster info', async () => {
    const info = await client.getClusterStatus({
      clusterName: 'cluster-1',
    });
    expect(info!.status.clusterName + info!.status.type).toEqual('cluster-1aws');
  });

  it('get container status', async () => {
    const status = await client.getContainerStatus({
      clusterName: 'cluster-1',
      containerId: 'container1',
    });
    expect(status!.containerStatus).toEqual('success');
  });
});
