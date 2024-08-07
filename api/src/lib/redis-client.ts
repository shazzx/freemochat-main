import { Redis } from '@upstash/redis/nodejs';
 
export const createRedisClient = (restUrl: string, restToken: string) => {
  const redis = new Redis({
    url: restUrl,
    token: restToken,
  });
  return redis;
};