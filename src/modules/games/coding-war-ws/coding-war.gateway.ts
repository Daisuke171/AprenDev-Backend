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
    console.log(`✅ [Connection] Client connected: ${this.CWService.getUsername(client.id)}`);
    console.log(`📊 [Connection] Client ID: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const username = this.CWService.getUsername(client.id);
    this.CWService.removeUser(client.id);
    console.log(`❌ [Disconnect] Client disconnected: ${username}`);
  }

  /* -------------------- ROOMS -------------------- */

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @MessageBody() data: { roomName: string; isPrivate?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🔵 [createRoom] Received request');
    console.log('📦 [createRoom] Data:', data);
    console.log('👤 [createRoom] Client ID:', client.id);
    
    const roomName = data.roomName || data;
    
    if (!roomName || (typeof roomName === 'string' && roomName.trim() === '')) {
      console.log('❌ [createRoom] Room name is invalid');
      throw new WsException('Room name is required');
    }

    const roomId = this.CWService.createRoom(
      typeof roomName === 'string' ? roomName : 'Test Room',
      client.id,
    );

    console.log('✅ [createRoom] Room created:', roomId);
    
    client.join(roomId);
    console.log('✅ [createRoom] Client joined room:', roomId);

    // Emit game state to the room creator
    this.emitGameState(roomId);
    console.log('✅ [createRoom] Game state emitted');

    // Send roomCreated event to the client
    client.emit('roomCreated', {
      success: true,
      roomId,
    });
    console.log('✅ [createRoom] roomCreated event sent to client');

    return {
      success: true,
      roomId,
    };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🔵 [joinRoom] Received request');
    console.log('📦 [joinRoom] Data type:', typeof data);
    console.log('📦 [joinRoom] Data value:', data);
    console.log('📦 [joinRoom] Data (stringified):', JSON.stringify(data));
    console.log('👤 [joinRoom] Client ID:', client.id);
    
    // Handle case where data might be a string or an object
    let actualRoomId = data;
    if (typeof data === 'object' && data !== null && data.roomId) {
      console.log('⚠️ [joinRoom] Data is an object, extracting roomId...');
      actualRoomId = data.roomId;
      console.log('📦 [joinRoom] Extracted roomId:', actualRoomId);
    }
    
    const room = this.CWService.getRoom(actualRoomId);
    if (!room) {
      console.log('❌ [joinRoom] Room does not exist:', actualRoomId);
      throw new WsException('Room does not exist');
    }

    const capacity = this.CWService.getRoomCapacity(actualRoomId);
    if (capacity >= 2) {
      console.log('❌ [joinRoom] Room is full:', actualRoomId, 'Capacity:', capacity);
      throw new WsException('Room is full');
    }

    const users = this.CWService.getUsersInRoom(actualRoomId);
    if (users?.includes(client.id)) {
      console.log('❌ [joinRoom] User already in room');
      throw new WsException('User already in room');
    }

    if (!this.CWService.joinRoom(actualRoomId, client.id)) {
      console.log('❌ [joinRoom] Failed to join room');
      throw new WsException('Failed to join room');
    }

    console.log('✅ [joinRoom] Client joined room:', actualRoomId);
    
    client.join(actualRoomId);

    this.server.to(actualRoomId).emit('userJoined', {
      userId: client.id,
      username: this.CWService.getUsername(client.id),
    });
    console.log('✅ [joinRoom] userJoined event emitted');

    // Send updated game state to room
    this.emitGameState(actualRoomId);

    return {
      success: true,
      roomId: actualRoomId,
    };
  }

  @SubscribeMessage('confirmReady')
  handleConfirmReady(
    @MessageBody() data: { roomId: string; ready: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('🔵 [confirmReady] Received request');
    console.log('📦 [confirmReady] Data:', data);
    console.log('👤 [confirmReady] Client ID:', client.id);
    
    const { roomId } = data;
    const ready = data.ready ?? true;

    this.CWService.setReady(roomId, client.id, ready);
    console.log(`✅ [confirmReady] Player ready status set: ${ready}`);

    // Emit updated game state
    this.emitGameState(roomId);

    // Check if all players are ready and room has 2 players
    const users = this.CWService.getUsersInRoom(roomId);
    console.log('👥 [confirmReady] Users in room:', users?.length, users);
    
    if (users && users.length === 2 && this.CWService.isAllReady(roomId)) {
      console.log('🎮 [confirmReady] All players ready! Starting game!');
      this.CWService.setGameStarted(roomId, true);
      this.server.to(roomId).emit('gameStarted', {
        message: 'Game is starting!',
        roomId,
      });
      console.log('✅ [confirmReady] gameStarted event emitted');
      // Send game state with "PlayingState" flag
      this.emitGameState(roomId);
    } else {
      console.log('⏳ [confirmReady] Waiting for all players to be ready');
    }
  }

  private emitGameState(roomId: string) {
    const users = this.CWService.getUsersInRoom(roomId);
    const readyStatus = this.CWService.getReadyStatus(roomId);
    const gameStarted = this.CWService.isGameStarted(roomId);

    console.log('📤 [emitGameState] Emitting to room:', roomId);
    console.log('   - Players:', users);
    console.log('   - Ready:', readyStatus);
    console.log('   - Game Started:', gameStarted);

    this.server.to(roomId).emit('gameState', {
      players: users || [],
      ready: readyStatus,
      state: gameStarted ? 'PlayingState' : 'WaitingState',
      roomInfo: {
        id: roomId,
      },
    });
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

  @SubscribeMessage('requestGameState')
  handleRequestGameState(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.emitGameState(data.roomId);
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

    // Broadcast full line input to opponent
    client.to(data.roomId).emit('typingUpdate', {
      playerId: client.id,
      lineIndex: data.lineIndex,
      input: data.input,
    });
  }

  @SubscribeMessage('lineCommit')
  handleLineCommit(
    @MessageBody()
    data: {
      roomId: string;
      lineIndex: number;
      input: string;
      isPerfect: boolean;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.roomId) return;

    const users = this.CWService.getUsersInRoom(data.roomId);
    if (!users || !users.includes(client.id)) return;

    // Broadcast line completion to opponent
    client.to(data.roomId).emit('lineCommitted', {
      playerId: client.id,
      lineIndex: data.lineIndex,
      input: data.input,
      isPerfect: data.isPerfect,
    });
  }
}
