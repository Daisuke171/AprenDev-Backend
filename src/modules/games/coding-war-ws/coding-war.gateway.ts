import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CodingWarWsService } from './coding-war-ws.service';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict domains
  },
})
export class CodingWarGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly CWService: CodingWarWsService) {}

  /* -------------------- LIFECYCLE -------------------- */

  afterInit(server: Server) {
    console.log('CodingWar WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.CWService.addUser(client.id, `Usuario_${client.id}`);
    console.log(`Client connected: ${this.CWService.getUsername(client.id)}`);
  }

  handleDisconnect(client: Socket) {
    const username = this.CWService.getUsername(client.id);
    this.CWService.removeUser(client.id);
    console.log(`Client disconnected: ${username}`);
  }

  /* -------------------- ROOMS -------------------- */

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @MessageBody() roomName: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!roomName || roomName.trim() === '') {
      throw new WsException('Room name is required');
    }

    const roomId = this.CWService.createRoom(roomName, client.id);

    client.join(roomId);

    return {
      success: true,
      roomId,
    };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.CWService.getRoom(roomId);
    if (!room) {
      throw new WsException('Room does not exist');
    }

    if (this.CWService.getRoomCapacity(roomId) >= 2) {
      throw new WsException('Room is full');
    }

    const users = this.CWService.getUsersInRoom(roomId);
    if (users?.includes(client.id)) {
      throw new WsException('User already in room');
    }

    if (!this.CWService.joinRoom(roomId, client.id)) {
      throw new WsException('Failed to join room');
    }

    client.join(roomId);

    this.server.to(roomId).emit('userJoined', {
      userId: client.id,
      username: this.CWService.getUsername(client.id),
    });

    return {
      success: true,
      roomId,
    };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.CWService.leaveRoom(roomId, client.id)) {
      throw new WsException('Failed to leave room');
    }

    client.leave(roomId);

    this.server.to(roomId).emit('userLeft', {
      userId: client.id,
    });

    return {
      success: true,
      roomId,
    };
  }

  @SubscribeMessage('deleteRoom')
  handleDeleteRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.CWService.deleteRoom(roomId)) {
      throw new WsException('Failed to delete room');
    }

    this.server.to(roomId).emit('roomDeleted', { roomId });

    return {
      success: true,
      roomId,
    };
  }

  /* -------------------- GAME EVENTS -------------------- */

  @SubscribeMessage('typingProgress')
  handleTypingProgress(
    @MessageBody()
    data: {
      roomId: string;
      lineIndex: number;
      input: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.roomId) return;

    const users = this.CWService.getUsersInRoom(data.roomId);
    if (!users || !users.includes(client.id)) return;

    client.to(data.roomId).emit('typingUpdate', {
      playerId: client.id,
      lineIndex: data.lineIndex,
      input: data.input,
    });
  }
}
