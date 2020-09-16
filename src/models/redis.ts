import redis from 'redis';
import { RedisCallback } from '../common/types';

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

  public on(pattern: string, callback: RedisCallback) {
    this.subscriber.psubscribe(`__keyspace@0__:${pattern}`);
    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      // _pattern : __keyspace@0__:${pattern}
      // channel : pattern matched value
      // message : type of event (ex. set, hmset)
      const key = channel.slice(15);
      this.client.hgetall(key, (err, value) => {
        callback(err, key, value);
      });
    });
  }

  public off(pattern: string) {
    this.subscriber.punsubscribe(`__keyspace@0__:${pattern}`);
  }

  public once(pattern: string): Promise<any> {
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

  public get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.hgetall(key, (err, value) => {
        if (err) {
          reject(err);
        } else {
          resolve(value);
        }
      });
    });
  }

  public set(key: string, value: object) {
    return new Promise((resolve, reject) => {
      this.client.hmset(key, { ...value }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
