import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  constructor (
      private readonly redisService: RedisService,
      private readonly jwtService: JwtService
    ) {}



  async register (  
  username: string,
  lastname: string,
  dni: string,
  birthday: string,
  password: string,
  confirmPassword: string) {

    const redis = this.redisService.getClient();

    //verificar si existe el user
    const userExist = await redis.exists(`user:${username}`);
    if (userExist) {
      return { ok: false, message: `El usuario 👨‍🦲${username.toUpperCase()} ya existe` };
    }

    //verificar si las contraseñas coinciden
    if (password !== confirmPassword) {
  return { ok: false, message: 'Las contraseñas no coinciden' };
}

//hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

   //guardar el user en redis
   await redis.hSet(`user:${username}`, {
  username,
  lastname,
  dni,
  birthday,
  password: hashedPassword,
  confirmPassword: hashedPassword,
  createdAt: new Date().toISOString(),
});

  await redis.sAdd('users', username);

  return { ok: true, message: 'Usuario registrado', user: { username } };
  }
     

  async login (username: string, password: string) {
    const redis = this.redisService.getClient();
    const user = await redis.hGetAll(`user:${username}`);

    if (!user?.password) {
      return { ok: false, message: 'Usuario no encontrado' };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { ok: false, message: 'Credenciales inválidas' };
    }

    const token = this.jwtService.sign({ username });
    await redis.set(`session:${username}`, token);

    return { ok: true, username, token };
  }
}

