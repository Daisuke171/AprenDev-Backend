import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { WebSocket } from 'ws';
import { RedisService } from '../redis/redis.service';
import { HashService } from '../security/hash.service';

@WebSocketGateway(8000, { cors:{ origin: 'http://localhost:4325' } })
export class AuthGateway {
  constructor(
    private readonly redisService: RedisService,
    private readonly hashService: HashService,
  ) {}

  // Handler para "register"
  @SubscribeMessage('register')
  async handleRegister(
    @MessageBody() payload: { username: string; password: string },
    @ConnectedSocket() client: WebSocket,){
   
    const { username, password } = payload;
    const redis = this.redisService.getClient();

    const hashedPassword = await this.hashService.hashPassword(password);
    await redis.hSet(`user:${username}`, { username, password: hashedPassword });

    if (!username || !password) {
      return client.send(
        JSON.stringify({
          type: 'error',
          payload: { message: 'Datos incompletos' },
        }),
      );
    }

    client.send(
      JSON.stringify({
        type: 'register',
        payload: {username},
      }),
    );
     return { status: 'ok', message: `Usuario ${username} registrado` };
  }

  // Handler para "login"
  @SubscribeMessage('login')
  async handleLogin(
    @MessageBody() payload: { username: string; password: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    const { username, password } = payload;

    const redis = this.redisService.getClient();
    const user = await redis.hGetAll(`user:${username}`);

    if (user && user.password === password) {
      client.send(
        JSON.stringify({
          type: 'ok',
          payload: { message: 'Login exitoso' },
        }),
      );
    } else {
      client.send(
        JSON.stringify({
          type: 'error',
          payload: { message: 'Credenciales inválidas' },
        }),
      );
    }
  }

  // Handler para "logout"
  @SubscribeMessage('logout')
  async handleLogout(
    @MessageBody() payload: { username: string },
    @ConnectedSocket() client: WebSocket,
  ) {
    const { username } = payload;

    if (!username) {
      return client.send(
        JSON.stringify({
          type: 'error',
          payload: { message: 'Falta el username' },
        }),
      );
    }

    try {
      const redis = this.redisService.getClient();
      await redis.del(`session:${username}`);

      client.send(
        JSON.stringify({
          type: 'ok',
          payload: { message: 'Logout exitoso', username },
        }),
      );
    } catch (err) {
      client.send(
        JSON.stringify({
          type: 'error',
          payload: { message: 'Error en logout', details: err.message },
        }),
      );
    }
  }
}
