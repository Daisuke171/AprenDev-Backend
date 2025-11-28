import { WebSocket } from 'ws';
import { RedisService } from '../redis/redis.service';
import { HashService } from '../security/hash.service';
export declare class AuthGateway {
    private readonly redisService;
    private readonly hashService;
    constructor(redisService: RedisService, hashService: HashService);
    handleRegister(payload: {
        username: string;
        password: string;
    }, client: WebSocket): Promise<void | {
        status: string;
        message: string;
    }>;
    handleLogin(payload: {
        username: string;
        password: string;
    }, client: WebSocket): Promise<void>;
    handleLogout(payload: {
        username: string;
    }, client: WebSocket): Promise<void>;
}
