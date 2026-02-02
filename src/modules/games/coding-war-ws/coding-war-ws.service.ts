import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

interface Room {
  id: string;
  name: string;
  ownerId: string;
  members: Set<string>;
  ready: Map<string, boolean>;
  gameStarted: boolean;
}

@Injectable()
export class CodingWarWsService {
  /* -------------------- USERS -------------------- */

  private users = new Map<string, string>();

  addUser(clientId: string, username: string) {
    this.users.set(clientId, username);
  }

  removeUser(clientId: string) {
    this.users.delete(clientId);
    this.removeUserFromAllRooms(clientId);
  }

  getUsername(clientId: string): string | undefined {
    return this.users.get(clientId);
  }

  getAllUsers(): string[] {
    return [...this.users.values()];
  }

  /* -------------------- ROOMS -------------------- */

  private rooms = new Map<string, Room>();

  createRoom(roomName: string, ownerId: string): string {
    const roomId = randomUUID();

    this.rooms.set(roomId, {
      id: roomId,
      name: roomName,
      ownerId,
      members: new Set([ownerId]),
      ready: new Map([[ownerId, false]]),
      gameStarted: false,
    });

    return roomId;
  }

  getRoom(roomId: string): Omit<Room, 'members'> & { members: string[] } | undefined {
    console.log('🔍 [Service] Looking for room:', roomId);
    console.log('📋 [Service] Available rooms:', Array.from(this.rooms.keys()));
    const room = this.rooms.get(roomId);
    if (!room) {
      console.log('❌ [Service] Room not found:', roomId);
      return undefined;
    }

    console.log('✅ [Service] Room found:', roomId);
    return {
      ...room,
      members: [...room.members],
    };
  }

  getRoomCapacity(roomId: string): number {
    const room = this.rooms.get(roomId);
    return room ? room.members.size : 0;
  }

  getUsersInRoom(roomId: string): string[] | undefined {
    const room = this.rooms.get(roomId);
    return room ? [...room.members] : undefined;
  }

  joinRoom(roomId: string, clientId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (room.members.has(clientId)) return false;

    room.members.add(clientId);
    room.ready.set(clientId, false);
    return true;
  }

  setReady(roomId: string, clientId: string, ready: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room || !room.members.has(clientId)) return false;
    room.ready.set(clientId, ready);
    return true;
  }

  isAllReady(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (room.members.size < 2) return false;
    return Array.from(room.ready.values()).every((ready) => ready);
  }

  getReadyStatus(roomId: string): Record<string, boolean> {
    const room = this.rooms.get(roomId);
    if (!room) return {};
    const status: Record<string, boolean> = {};
    room.ready.forEach((ready, clientId) => {
      status[clientId] = ready;
    });
    return status;
  }

  setGameStarted(roomId: string, started: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.gameStarted = started;
    return true;
  }

  isGameStarted(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.gameStarted : false;
  }

  leaveRoom(roomId: string, clientId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (!room.members.has(clientId)) return false;

    room.members.delete(clientId);

    if (room.members.size === 0) {
      this.rooms.delete(roomId);
    }

    return true;
  }

  deleteRoom(roomId: string, requesterId?: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (requesterId && room.ownerId !== requesterId) {
      return false;
    }

    return this.rooms.delete(roomId);
  }

  private removeUserFromAllRooms(clientId: string) {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.members.has(clientId)) {
        room.members.delete(clientId);

        if (room.members.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    }
  }

  /* -------------------- GAME LOGIC -------------------- */

  updateCodeText(
    roomId: string,
    clientId: string,
    code: string,
  ): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    if (!room.members.has(clientId)) return false;

    // Placeholder for authoritative game state
    return true;
  }
}
