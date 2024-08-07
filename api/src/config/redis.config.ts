import { Redis, RedisOptions } from 'ioredis';

let redisClient: Redis | null = null

export function getRedisClient(): Redis {
    const redisOptions: RedisOptions = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '7777', 10),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    };


    redisClient = new Redis();

    redisClient.on('error', (error) => {
    });

    redisClient.on('connect', () => {
        console.log('Successfully connected to Redis');
    });

    return redisClient;
}
