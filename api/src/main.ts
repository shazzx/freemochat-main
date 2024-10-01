import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'
import { RedisIoAdapter } from './config/socket.io-adapter';
import { AllExceptionsFilter } from './global.exceptions.filter';

declare const module: any

async function bootstrap() {
  // const httpsOptions = process.env.ENV == "PRODUCTION" ? {
  //   key: fs.readFileSync('/etc/letsencrypt/live/freedombook.co/privkey.pem'),
  //   cert: fs.readFileSync('/etc/letsencrypt/live/freedombook.co/fullchain.pem'),
  // } : {};

  const app = await NestFactory.create(AppModule);

  const origin = process.env.ENV == "PRODUCTION" ? process.env.APP_URL_PROD : process.env.APP_URL_DEV

  app.enableCors({ origin, credentials: true })
  app.use(cookieParser())
  app.useGlobalFilters(new AllExceptionsFilter())

  const redisIoAdapter = new RedisIoAdapter()
  await redisIoAdapter.connectToRedis()


  app.setGlobalPrefix('api')
  await app.listen(process.env.PORT || 3000, '0.0.0.0');

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();

// app.enableCors({
//   origin: 'http://freedombook.s3-website-us-east-1.amazonaws.com',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// });