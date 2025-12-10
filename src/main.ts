import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware para leer cookies
  app.use(cookieParser());
  
  //habilitar cors con credenciales
    app.enableCors({
    origin: "http://localhost:4321", //frontend Astro
    credentials: true,
  });


  const port = process.env.PORT ?? 3010;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}

void bootstrap();
