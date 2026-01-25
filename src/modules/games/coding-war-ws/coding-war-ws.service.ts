import { Injectable } from '@nestjs/common';

@Injectable()
export class CodingWarWsService {
  private users: Map<string, string> = new Map();

  addUser(clientId: string, username: string) {
    this.users.set(clientId, username);
  }

  removeUser(clientId: string) {
    this.users.delete(clientId);
  }

  getUsername(clientId: string): string | undefined {
    return this.users.get(clientId);
  }

  getAllUsers(): string[] {
    return Array.from(this.users.values());
  }
}
