import { Inject, Injectable } from "@nestjs/common";
import {Redis} from 'ioredis'
import { ObjectId } from "mongoose";

@Injectable()
export class CacheService {
  private readonly MAX_OTP_PER_DAY = 2;
  constructor(@Inject("REDIS_CLIENT") private readonly redis: Redis) {}


  async checkOtpLimit(phoneNumber: string): Promise<boolean> {
    const key = `otp:${phoneNumber}:${this.getCurrentDate()}`;
    const count = await this.redis.get(key);

    console.log(count, 'otp count', key)
    return count !== null && parseInt(count, 10) >= (this.MAX_OTP_PER_DAY  || 2);
  }
  
  async incrementOtpCount(phoneNumber: string): Promise<void> {
    const key = `otp:${phoneNumber}:${this.getCurrentDate()}`;
    const ttl = await this.redis.ttl(key);
    console.log(ttl, key)
    
    const increment = await this.redis.incr(key);
    console.log(increment, 'incremented')
    
    if (ttl < 0) {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const secondsUntilEndOfDay = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
      
      await this.redis.expire(key, secondsUntilEndOfDay);
    }
  }
  
  getCurrentDate(): string {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  async get(key: string): Promise<string> {
    return this.redis.get(key);
  }

  

  async set(key: string, value: any, expireIn: number) {
    await this.redis.set(key, value);
  }

  async setUserRefreshToken(userId: string, token: string): Promise<boolean> {
    try {
    await this.redis.set(`refresh-token:${userId}`, token); 
    return true
    } catch (error) {
      console.log(error)
      return false
    }
  }

  async setUserPushToken(userId: string, token: string): Promise<boolean> {
    try {
    await this.redis.set(`push-tokens:${userId}`, token); 
    return true
    } catch (error) {
      console.log(error)
      return false
    }
  }

  async getUserPushToken(userId: string): Promise<string | boolean> {
    try {
    return await this.redis.get(`push-tokens:${userId}`); 
    } catch (error) {
      console.log(error)
      return false
    }
  }

  async getUserRefreshToken(userId: string): Promise<string> {
    try {
    return await this.redis.get(`refresh-token:${userId}`); 
    } catch (error) {
      console.log(error)
      return error 
    }
  }

  async setForgetPassword(userId: string, authId: string): Promise<boolean> {
    console.log(userId)
    try {
    let token = await this.redis.set(`authId:${userId}`, authId, 'EX', 600); 
    console.log(token)
    return true
    } catch (error) {
      console.log(error)
      return false
    }
  }


  async getForgetPassword(userId: string): Promise<string> {
    console.log(userId)
    try {
    return await this.redis.get(`authId:${userId}`); 
    } catch (error) {
      console.log(error)
      return error 
    }
  }

  async invalidateForgetPassword(userId: string, token: string): Promise<boolean> {
    try {
    await this.redis.del(`authId:${userId}`);
    return true
    } catch (error) {
      console.log(error)
      return false
    }
  }


  async invalidateUesrRefreshToken(userId: string, token: string): Promise<boolean> {
    try {
    await this.redis.del(`refresh-token:${userId}`);
    return true
    } catch (error) {
      console.log(error)
      return false
    }
  }


  async invalidate(key: string) {
    await this.redis.del(key);
  }
  async setUserOnline(userData: {userId: string, username: string, images: {profile: string, cover: string}, socketId: string}): Promise<void> {
    let userId = userData.userId
    let _userData = JSON.stringify(userData)
    try {
      await this.redis.hset('online_users', userId, _userData);
    } catch (error) {
      console.log(error)
    }
  }

  async setUserOffline(userId: string): Promise<void> {
    try {
    await this.redis.hdel('online_users', userId);
    await this.redis.hset('offline_users', userId, JSON.stringify({lastSeenAt: Date.now(), userId}));
    } catch (error) {
      console.log(error)      
    }
  }

  async getOfflineUser(userId: string) {
    try {
    return await this.redis.hget('offline_users', userId);
    } catch (error) {
      console.log(error)      
    }
  }

  async isUserOnline(userId: string): Promise<number> {
    return await this.redis.hexists(`online_users`, userId);
  }


  async getOnlineFriends(friends: any): Promise<any> {
    console.log(friends, 'gettings online friends...')
    if(friends.length == 0){
      return []
    }
    return await this.redis.hmget("online_users", ...friends)
  }

  async getOnlineUser(userId: any): Promise<any> {
    return await this.redis.hget("online_users", userId);
  }
}
  // async cacheCommentsPage(key: string, data) {
    // if (data.likesCount >= 100) {
    //   await this.redis.set(`comments:${comment._id}:${page}`, JSON.stringify(comment), {
    //     keepTtl: true,

    //   });
    // }
  // }
  
  // async getCommentsPage(key: string): Promise < any > {
  //   const cachedComment: string = await this.redis.get(key);
  //   return cachedComment ? JSON.parse(cachedComment) : null;
  // }
  