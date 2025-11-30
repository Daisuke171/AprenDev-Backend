import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { HashService } from '../security/hash.service';
import { AuthService } from './auth.service';

@WebSocketGateway({
  cors: { origin: 'http://localhost:4325' },
})
export class AuthGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly redisService: RedisService,
    private readonly hashService: HashService,
    private readonly authService: AuthService,
  ) {}

  @SubscribeMessage('register')
  handleRegister(client: Socket, payload: any) {
    console.log('REGISTER recibido:', payload);
    // ejemplo de respuesta al cliente
    this.server.to(client.id).emit('register_response', { status: 'ok', payload });
  }


  @SubscribeMessage('login')
  async login(
    @MessageBody() { username, password }: { username: string; password: string },
    @ConnectedSocket() client: Socket,
  ) {
    const redis = this.redisService.getClient();
    const user = await redis.hGetAll(`user:${username}`);

    if (!user?.password) return client.emit('error', { message: 'Usuario no encontrado' });

    const valid = await this.hashService.comparePassword(password, user.password);
    if (!valid) return client.emit('error', { message: 'Credenciales inválidas' });

    const token = this.authService.generateToken(username);
    await redis.set(`session:${username}`, token);

    client.emit('login', { ok: true, username, token });
  }

  @SubscribeMessage('logout')
  async logout(
    @MessageBody() { token }: { token: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const decoded = this.authService.verifyToken(token);
      const redis = this.redisService.getClient();
      await redis.del(`session:${decoded.username}`);

      client.emit('logout', { ok: true, username: decoded.username });
    } catch {
      client.emit('error', { message: 'Token inválido o expirado' });
    }
  }
}
