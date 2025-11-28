import { OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';
type RedisClient = ReturnType<typeof createClient>;
export declare class RedisService implements OnModuleInit {
    private client;
    constructor();
    onModuleInit(): Promise<void>;
    getClient(): RedisClient;
}
export {};
