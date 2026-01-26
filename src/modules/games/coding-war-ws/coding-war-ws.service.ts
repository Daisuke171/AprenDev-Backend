import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

interface Room {
  id: string;
  name: string;
  ownerId: string;
  members: Set<string>;
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
    });

    return roomId;
  }

  getRoom(roomId: string): Omit<Room, 'members'> & { members: string[] } | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

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
    return true;
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
