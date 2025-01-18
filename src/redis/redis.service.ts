import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "redis";
import type { RedisClientType } from "redis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private subscriber: RedisClientType;
  private publisher: RedisClientType;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>("REDIS_URL");

    // Create Redis clients
    this.client = createClient({
      url: redisUrl,
    });

    this.subscriber = this.client.duplicate();
    this.publisher = this.client.duplicate();

    // Connect all clients
    await Promise.all([
      this.client.connect(),
      this.subscriber.connect(),
      this.publisher.connect(),
    ]);
  }

  async onModuleDestroy() {
    // Disconnect all clients
    await Promise.all([
      this.client.disconnect(),
      this.subscriber.disconnect(),
      this.publisher.disconnect(),
    ]);
  }

  getClient(): RedisClientType {
    return this.client;
  }

  getSubscriber(): RedisClientType {
    return this.subscriber;
  }

  getPublisher(): RedisClientType {
    return this.publisher;
  }

  async subscribe(channel: string, callback: (message: string) => void) {
    await this.subscriber.subscribe(channel, callback);
  }

  async publish(channel: string, message: string) {
    await this.publisher.publish(channel, message);
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string) {
    await this.client.del(key);
  }
}
