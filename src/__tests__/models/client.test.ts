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
    redis.hmset('worker:info:cluster-1', { clusterName: 'cluster-1', type: 'aws' });
    redis.hmset('worker:info:cluster-2', { clusterName: 'cluster-2', type: 'gcp' });
    redis.hmset('worker:info:cluster-3', { clusterName: 'cluster-3', type: 'azure' });
    redis.hmset('worker:info:cluster-4', { clusterName: 'cluster-4', type: 'onprem' });
  });

  afterAll((done) => {
    redisClient.unref();
    client.unref();
    done();
  });

  it('get cluster list', async () => {
    const list = await client.getClusterList();
    expect(list.length).toEqual(4);
  });

  it('get cluster info', async () => {
    const info = await client.getClusterInfo({
      clusterName: 'cluster-1',
    });
    expect(info.clusterName + info.type).toEqual('cluster-1aws');
  });
});
