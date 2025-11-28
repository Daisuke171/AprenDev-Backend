"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const ws_1 = require("ws");
const redis_service_1 = require("../redis/redis.service");
const hash_service_1 = require("../security/hash.service");
let AuthGateway = class AuthGateway {
    redisService;
    hashService;
    constructor(redisService, hashService) {
        this.redisService = redisService;
        this.hashService = hashService;
    }
    async handleRegister(payload, client) {
        const { username, password } = payload;
        const redis = this.redisService.getClient();
        const hashedPassword = await this.hashService.hashPassword(password);
        await redis.hSet(`user:${username}`, { username, password: hashedPassword });
        if (!username || !password) {
            return client.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Datos incompletos' },
            }));
        }
        client.send(JSON.stringify({
            type: 'register',
            payload: { username },
        }));
        return { status: 'ok', message: `Usuario ${username} registrado` };
    }
    async handleLogin(payload, client) {
        const { username, password } = payload;
        const redis = this.redisService.getClient();
        const user = await redis.hGetAll(`user:${username}`);
        if (user && user.password === password) {
            client.send(JSON.stringify({
                type: 'ok',
                payload: { message: 'Login exitoso' },
            }));
        }
        else {
            client.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Credenciales inválidas' },
            }));
        }
    }
    async handleLogout(payload, client) {
        const { username } = payload;
        if (!username) {
            return client.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Falta el username' },
            }));
        }
        try {
            const redis = this.redisService.getClient();
            await redis.del(`session:${username}`);
            client.send(JSON.stringify({
                type: 'ok',
                payload: { message: 'Logout exitoso', username },
            }));
        }
        catch (err) {
            client.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Error en logout', details: err.message },
            }));
        }
    }
};
exports.AuthGateway = AuthGateway;
__decorate([
    (0, websockets_1.SubscribeMessage)('register'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ws_1.WebSocket]),
    __metadata("design:returntype", Promise)
], AuthGateway.prototype, "handleRegister", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('login'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ws_1.WebSocket]),
    __metadata("design:returntype", Promise)
], AuthGateway.prototype, "handleLogin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('logout'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ws_1.WebSocket]),
    __metadata("design:returntype", Promise)
], AuthGateway.prototype, "handleLogout", null);
exports.AuthGateway = AuthGateway = __decorate([
    (0, websockets_1.WebSocketGateway)(8000, { cors: { origin: 'http://localhost:4325' } }),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        hash_service_1.HashService])
], AuthGateway);
//# sourceMappingURL=auth.gateway.js.map