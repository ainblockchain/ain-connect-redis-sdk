import Redis from 'redis';
import { RedisCallback } from '../common/types';

export default class RedisClient {
  private client: Redis.RedisClient;

  private subscriber: Redis.RedisClient

  constructor(options?: Redis.ClientOpts) {
    // Cannot use 'get/set' command in the context of a subscribed client
    // We need both 'get/set' client and 'subscribe' client.
    this.client = Redis.createClient(options);
    this.subscriber = Redis.createClient(options);
  }

  public getClient() {
    return this.client;
  }

  public on(pattern: string, callback: RedisCallback) {
    this.subscriber.psubscribe(`__keyspace@0__:${pattern}`);
    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      // _pattern : __keyspace@0__:${pattern}
      // channel : pattern matched value
      // message : type of event (ex. set, hset)
      if (message === 'set' || message === 'hset') {
        const key = channel.slice(15);
        this.get(key).then((value) => {
          callback(null, key, value);
        }).catch((err) => {
          callback(err, null, null);
        });
      }
    });
  }

  public off(pattern: string) {
    this.subscriber.punsubscribe(`__keyspace@0__:${pattern}`);
  }

  public once(pattern: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.subscriber.psubscribe(`__keyspace@0__:${pattern}`);
      this.subscriber.on('pmessage', (_pattern, channel, message) => {
        if (message === 'set' || message === 'hset') {
          this.subscriber.unsubscribe(`__keyspace@0__:${pattern}`);
          const key = channel.slice(15);
          this.get(key).then((value) => {
            resolve(value);
          }).catch((err) => {
            reject(err);
          });
        }
      });
    });
  }

  public get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.type(key, (err, type) => {
        if (err) {
          reject(err);
        } else if (type === 'hash') {
          this.client.hgetall(key, (error, value) => {
            if (error) {
              reject(error);
            } else {
              resolve(value);
            }
          });
        } else { // type === 'string'
          this.client.get(key, (error, value) => {
            if (error) {
              reject(error);
            } else {
              resolve(value);
            }
          });
        }
      });
    });
  }

  public set(key: string, value: object | string) {
    return new Promise((resolve, reject) => {
      if (typeof value === 'object') {
        this.client.hmset(key, { ...value }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } else { // type === 'string'
        this.client.set(key, value, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      }
    });
  }
}
