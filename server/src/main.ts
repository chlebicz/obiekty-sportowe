import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.enableCors({
    origin: env('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true,
  });

  await app.listen(env('PORT', '3001'));
}

bootstrap();
