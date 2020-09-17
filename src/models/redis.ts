import Redis from 'redis';
import { RedisCallback } from '../common/types';

interface CallbackTable {
  [key: string]: RedisCallback
}

export default class RedisClient {
  private callbackTable: CallbackTable;

  private client: Redis.RedisClient;

  private onSub: Redis.RedisClient

  private onceSub: Redis.RedisClient

  constructor(options?: Redis.ClientOpts) {
    // Cannot use 'get/set' command in the context of a subscribed client
    // We need both 'get/set' client and 'subscribe' client.
    this.client = Redis.createClient(options);
    this.onSub = Redis.createClient(options);
    this.onceSub = Redis.createClient(options);
    this.callbackTable = {};

    this.onSub.on('pmessage', (pattern, channel, message) => {
      // _pattern : __keyspace@0__:${pattern}
      // channel : pattern matched value
      // message : type of event (ex. set, hset)
      const _pattern = pattern.slice(15);
      if ((message === 'set' || message === 'hset')
          && this.callbackTable[_pattern]) {
        const key = channel.slice(15);
        this.get(key).then((value) => {
          this.callbackTable[_pattern](null, key, value);
        }).catch((err) => {
          this.callbackTable[_pattern](err, null, null);
        });
      }
    });
  }

  public unref() {
    this.client.unref();
    this.onSub.unref();
    this.onceSub.unref();
  }

  public getClient() {
    return this.client;
  }

  public on(pattern: string, callback: RedisCallback) {
    if (!this.callbackTable[pattern]) {
      this.callbackTable[pattern] = callback;
      this.onSub.psubscribe(`__keyspace@0__:${pattern}`);
    }
  }

  public off(pattern: string) {
    this.onSub.punsubscribe(`__keyspace@0__:${pattern}`);
    delete this.callbackTable[pattern];
  }

  public once(pattern: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.onceSub.psubscribe(`__keyspace@0__:${pattern}`);
      this.onceSub.on('pmessage', (_pattern, channel, message) => {
        if (message === 'set' || message === 'hset') {
          this.onceSub.unsubscribe(`__keyspace@0__:${pattern}`);
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
