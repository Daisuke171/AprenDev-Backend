import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGateway } from './auth.gateway';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller'; // 👈 nuevo
import { RedisService } from '../redis/redis.service';
import { HashService } from '../security/hash.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'SUPER_SECRET_KEY', // chore: crear un env
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController], // 👈 necesario para habilitar el endpoint
  providers: [AuthGateway, AuthService, RedisService, HashService],
})
export class AuthModule {}
