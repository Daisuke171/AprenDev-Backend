import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

type RedisClient = ReturnType<typeof createClient>;

@Injectable()
export class RedisService implements OnModuleInit {

  private client: RedisClient;

  constructor() {
    // Use REDIS_URL if present, otherwise default to localhost
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

    this.client = createClient({
      url,
      socket: {
        // simple reconnect strategy: wait n * 50ms up to ~2.5s
        reconnectStrategy: (retries: number) => Math.min(retries * 50, 2500),
      },
    });
  }

  async onModuleInit() {
    // Log Redis errors but avoid crashing the whole app if Redis is down
    this.client.on('error', (err) => console.error('Redis error', err));

    try {
      await this.client.connect();
      console.log('Redis conectado');
    } catch (err) {
      // If initial connect fails, log a warning and allow the app to continue.
      // The client's reconnectStrategy will attempt retries after this.
      console.warn('Redis connection failed on startup — continuing without Redis for now. Error:', err?.message ?? err);
    }
  }

  getClient(): RedisClient {
    return this.client;
  }
}
