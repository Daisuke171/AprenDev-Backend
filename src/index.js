import { connectRedis } from "./db/redis.js";
import { startServer } from "./ws/server.js";

async function bootstrap() {
  await connectRedis();   // valida conexión a Redis
  startServer();         // levanta servidor WebSocket
}

bootstrap();
