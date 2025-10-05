import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { allowed_origins } from '../config.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.getHttpAdapter().getInstance().disable('x-powered-by');

  app.enableCors({
    origin: allowed_origins,
    credentials: true
  });

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
