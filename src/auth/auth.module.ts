import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGateway } from './auth.gateway';
import { AuthService } from './auth.service';
import { RedisService } from '../redis/redis.service';
import { HashService } from '../security/hash.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'SUPER_SECRET_KEY', // chore: crear un env
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthGateway, AuthService, RedisService, HashService],
})
export class AuthModule {}
