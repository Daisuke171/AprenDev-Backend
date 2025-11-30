import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  generateToken(username: string) {
    return this.jwt.sign({ username });
  }

  verifyToken(token: string) {
    return this.jwt.verify(token);
  }
}
