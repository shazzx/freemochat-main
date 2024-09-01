import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'
import { RedisIoAdapter } from './config/socket.io-adapter';
import { AllExceptionsFilter } from './global.exceptions.filter';

declare const module: any

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.enableCors({
  //   origin: 'http://freedombook.s3-website-us-east-1.amazonaws.com',
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  //   credentials: true,
  // });
  app.enableCors({ origin: "http://localhost:5173", credentials: true })
  app.use(cookieParser())
  app.useGlobalFilters(new AllExceptionsFilter())

  const redisIoAdapter = new RedisIoAdapter()
  await redisIoAdapter.connectToRedis()

  app.setGlobalPrefix('api')
  await app.listen(process.env.PORT || 3000);


  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
