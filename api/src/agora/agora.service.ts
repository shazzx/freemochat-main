import { Injectable } from '@nestjs/common';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

const APP_ID = 'f41145d4d6fa4a3caab3104ac89622ec';
const APP_CERTIFICATE = '862cb080328045ff8a6b3621f5aefc44';

@Injectable()
export class AgoraService {
  generateToken(channelName: string, uid: string) {
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    return RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      expirationTimeInSeconds,      
      privilegeExpiredTs,
    );
  }
}