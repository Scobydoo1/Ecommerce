import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Webhook Stripe can body tho de kiem chu ky, xem stripe.controller.ts.
    rawBody: true,
  });

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

  // `PORT` truoc tien - xem ghi chu trong catalog-service/src/main.ts.
  const port = Number(process.env.PORT ?? process.env.ORDER_SERVICE_PORT ?? 3002);
  await app.listen(port);
  new Logger('Bootstrap').log(`order-service dang lang nghe tren cong ${port}`);
}

void bootstrap();
