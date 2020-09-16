import RedisClient from '../../models/redis';

let redisClient: RedisClient;

describe('redis', () => {
  beforeAll(() => {
    // need local redis server for test
    redisClient = new RedisClient();
  });

  afterAll((done) => {
    done();
  });

  it('set/get string test', async () => {
    await redisClient.set('strkey', 'value');
    const value = await redisClient.get('strkey');
    expect(value).toEqual('value');
  });

  it('set/get object test', async () => {
    const testObj = { key1: 'value1', key2: 'value2' };
    await redisClient.set('objkey', testObj);
    const value = await redisClient.get('objkey');
    expect(value).toEqual(testObj);
  });

  it('once test', async (done) => {
    redisClient.once('oncekey').then((value) => {
      expect(value).toEqual('oncevalue');
      done();
    });
    redisClient.set('oncekey', 'oncevalue');
  });

  it('once test', async (done) => {
    redisClient.on('onkey', (err, key, value) => {
      expect(value).toEqual('onvalue');
      redisClient.off('onkey');
      done();
    });
    redisClient.set('onkey', 'onvalue');
  });
});
