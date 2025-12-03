import {
  WebSocketGateway,
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
}
