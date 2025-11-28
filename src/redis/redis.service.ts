import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient} from 'redis'; //crea un cliente redis que se conecte al servidor

type RedisClient = ReturnType<typeof createClient>

@Injectable()
export class RedisService implements OnModuleInit {

  //Creacion cliente redis 
   private client: RedisClient;
  
   constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });
  }

  async onModuleInit() {
    this.client.on('error', (err) => console.error('Redis error', err));
    await this.client.connect();
    console.log('Redis conectado');
  }

  //metodo para obtener el cliente redis
  getClient(): RedisClient {
    return this.client;
  }
}
