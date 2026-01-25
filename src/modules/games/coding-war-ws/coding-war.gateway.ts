import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { CodingWarWsService } from './coding-war-ws.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
      origin: '*', // En producción, especifica dominios específicos
  },
})
export class CodingWarGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  constructor(private readonly CWService: CodingWarWsService) {}

  afterInit(server: Server) {
      console.log('Gateway inicializado');
  }

  handleConnection(client: Socket) {
      this.CWService.addUser(client.id, `Usuario_${client.id}`);
      console.log(`Nuevo cliente conectado: ${this.CWService.getUsername(client.id)}`);
  }

  handleDisconnect(client: Socket) {
      this.CWService.removeUser(client.id);
      console.log(`Cliente desconectado: ${this.CWService.getUsername(client.id)}`);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): string {
      return 'Mensaje recibido en el servidor';
  }
}
