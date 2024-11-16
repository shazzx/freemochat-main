import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import * as crypto from 'crypto';
import * as otplib from 'otplib';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key = crypto.scryptSync("process.env.ENCRYPTION_KEY", 'salt', 32);

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }


  async generateSecret(): Promise<string> {
    return otplib.authenticator.generateSecret();
  }

  async hash(text: string, salt?: number): Promise<string>{
    return await hash(text, salt)
  }

  async verifyHash(text: string, hashedText): Promise<boolean>{
    return await compare(text, hashedText)
  }
}