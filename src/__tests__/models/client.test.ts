import RedisClient from '../../models/redis';
import Client from '../../models/client';

let redisClient: RedisClient;
let client: Client;

describe('client', () => {
  beforeAll(() => {
    // need local redis server for test
    redisClient = new RedisClient();
    client = new Client();
    const redis = redisClient.getClient();
    const nodePool1 = {
      nodePool1: {
        gpuType: 'v100',
        osImage: 'ubuntu18.04',
        nodes: {
          node1: {
            capacity: {
              cpu: '100',
              memory: '1000',
              gpu: 1,
            },
            allocatable: {
              cpu: '100',
              memory: '1000',
              gpu: 1,
            },
          },
        },
      },
    };
    const nodePool2 = {
      nodePool1: {
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
    redis.hmset('worker:info:cluster-1', {
      clusterName: 'cluster-1',
      type: 'aws',
      nodePool: JSON.stringify(nodePool1),
    });
    redis.hmset('worker:info:cluster-2', {
      clusterName: 'cluster-2',
      type: 'gcp',
      nodePool: JSON.stringify(nodePool2),
    });
  });

  afterAll((done) => {
    redisClient.unref();
    client.unref();
    done();
  });

  it('get cluster list', async () => {
    const list = await client.getClusterList();
    expect(list.length).toEqual(2);
  });

  it('get specific cluster list', async () => {
    const list = await client.getClusterList({
      cpu: 100,
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

  it('no satified cluster', async () => {
    const list = await client.getClusterList({
      cpu: 500,
      memory: 20000,
      gpu: { v100: 1 },
    });
    expect(list.length).toEqual(0);
  });

  it('get cluster info', async () => {
    const info = await client.getClusterInfo({
      clusterName: 'cluster-1',
    });
    expect(info.clusterName + info.type).toEqual('cluster-1aws');
  });
});
