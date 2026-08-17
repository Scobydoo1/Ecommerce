import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: process.env.AUTH_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // `PORT` truoc tien: Render, Fly, Heroku va phan lon PaaS tiem cong qua bien
  // nay va health check se go dung cong do. `CATALOG_SERVICE_PORT` giu lai cho
  // may local, noi ba service chay cung luc nen moi cai can mot cong co dinh.
  const port = Number(process.env.PORT ?? process.env.CATALOG_SERVICE_PORT ?? 3001);
  await app.listen(port);
  new Logger('Bootstrap').log(`catalog-service dang lang nghe tren cong ${port}`);
}

void bootstrap();
