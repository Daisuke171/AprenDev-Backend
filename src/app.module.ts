import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SecurityModule } from './security/security.module';
import { RedisService } from './redis/redis.service';

@Module({
  imports: [
    AuthModule,      // 👈 tu módulo de autenticación (con AuthGateway)
    SecurityModule,  // 👈 tu módulo de seguridad (con HashService)
  ],
  controllers: [AppController],
  providers: [AppService, RedisService],
})
export class AppModule {}
