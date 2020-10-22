import RedisClient from '../../models/redis';

let redisClient: RedisClient;

describe('redis test', () => {
  beforeAll(() => {
    // need local redis server for test
    redisClient = new RedisClient();
    redisClient.getClient().flushall();
  });

  afterAll((done) => {
    redisClient.unref();
    done();
  });

  // string
  it('set/get string test', async () => {
    await redisClient.set('strkey', 'value');
    const value = await redisClient.get('strkey');
    expect(value).toEqual('value');
  });

  it('once string test', (done) => {
    redisClient.once('oncekey').then((value) => {
      expect(value).toEqual('oncevalue');
      done();
    });
    redisClient.set('oncekey', 'oncevalue');
  });

  it('on string test', (done) => {
    redisClient.on('onkey', (err, key, value) => {
      expect(value).toEqual('onvalue');
      redisClient.off('onkey');
      done();
    });
    redisClient.set('onkey', 'onvalue');
  });

  it('delete string key test', async () => {
    const reply = await redisClient.del('strkey');
    expect(reply).toEqual(1);
  });

  // object
  it('set/get object test', async () => {
    const testObj = { key1: 'value1', key2: JSON.stringify({ aaa: 1, ccc: 'ddd' }) };
    await redisClient.set('objkey', testObj);
    const value = await redisClient.get('objkey');
    expect(value).toEqual(testObj);
  });

  it('once object test', (done) => {
    const testObj = { key1: 'value1', key2: 'value2' };
    redisClient.once('onceobjkey').then((value) => {
      expect(value).toEqual(testObj);
      done();
    });
    redisClient.set('onceobjkey', testObj);
  });

  it('on object test', (done) => {
    const testObj = { key1: 'value1', key2: 'value2' };
    redisClient.on('onobjkey', (err, key, value) => {
      expect(value).toEqual(testObj);
      redisClient.off('onobjkey');
      done();
    });
    redisClient.set('onobjkey', testObj);
  });

  it('delete object key test', async () => {
    const reply = await redisClient.del('objkey');
    // reply == number of deleted fields
    expect(reply).toEqual(2);
  });
});
