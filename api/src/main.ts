import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'
import { RedisIoAdapter } from './config/socket.io-adapter';

declare const module: any

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: "http://localhost:5173", credentials: true })
  app.use(cookieParser())

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
