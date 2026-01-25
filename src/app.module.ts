import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SecurityModule } from './security/security.module';
import { RedisService } from './redis/redis.service';
import { CodingWarWsService } from './modules/games/coding-war-ws/coding-war-ws.service';
import { CodingWarWsModule } from './modules/games/coding-war-ws/coding-war-ws.module';

@Module({
  imports: [
    AuthModule,
    SecurityModule,
    CodingWarWsModule,
  ],
  controllers: [AppController],
  providers: [AppService, RedisService, CodingWarWsService],
})
export class AppModule {}
