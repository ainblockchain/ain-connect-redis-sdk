import redis from 'redis';

export default class RedisClient {
  private client: redis.RedisClient;

  private subscriber: redis.RedisClient

  constructor(options: redis.ClientOpts) {
    // Cannot use 'get/set' command in the context of a subscribed client
    // We need both 'get/set' client and 'subscribe' client.
    this.client = redis.createClient(options);
    this.subscriber = redis.createClient(options);
  }

  public getClient() {
    return this.client;
  }

  public on(pattern: string, callback: redis.Callback<any>) {
    this.subscriber.psubscribe(`__keyspace@0__:${pattern}`);
    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      // _pattern : __keyspace@0__:${pattern}
      // channel : pattern matched value
      // message : type of event (ex. set, hmset)
      const key = channel.slice(15);
      this.client.hgetall(key, callback);
    });
  }

  public once(pattern: string) {
    return new Promise((resolve, reject) => {
      this.subscriber.subscribe(`__keyspace@0__:${pattern}`);
      this.subscriber.on('pmessage', (_pattern, channel, message) => {
        this.subscriber.unsubscribe(`__keyspace@0__:${pattern}`);
        const key = channel.slice(15);
        this.client.hgetall(key, (err, reply) => {
          if (err) {
            reject(err);
          } else {
            resolve(reply);
          }
        });
      });
    });
  }

  public set(key: string, value: object) {
    return new Promise((resolve, reject) => {
      this.client.hmset(key, { ...value }, (err) => {
        if (err) {
          reject();
        } else {
          resolve();
        }
      });
    });
  }
}
