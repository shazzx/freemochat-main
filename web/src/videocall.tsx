import React, { useEffect, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const APP_ID = 'f41145d4d6fa4a3caab3104ac89622ec';

const VideoCall = () => {
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [client, setClient] = useState(null);
  const [channelName, setChannelName] = useState('');
  const [uid, setUid] = useState('');

  useEffect(() => {
    const init = async () => {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      setClient(client);

      const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalAudioTrack(microphoneTrack);
      setLocalVideoTrack(cameraTrack);

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers((prevUsers) => [...prevUsers, user]);
        }
      });

      client.on('user-unpublished', (user) => {
        setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
      });
    };

    init();

    return () => {
      localAudioTrack?.close();
      localVideoTrack?.close();
      client?.off('user-published');
      client?.off('user-unpublished');
      client?.close();
    };
  }, []);

  const generateToken = async (channelName, uid) => {
    const response = await fetch(`/agora/token?channelName=${channelName}&uid=${uid}`);
    return response.text();
  };

  const joinChannel = async () => {
    const token = await generateToken(channelName, uid);
    console.log(token)
    await client.join(APP_ID, channelName, token, uid);
    await client.publish([localAudioTrack, localVideoTrack]);
  };

  const leaveChannel = async () => {
    await client.unpublish([localAudioTrack, localVideoTrack]);
    await client.leave();
    setRemoteUsers([]);
  };

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Channel Name"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
        />
        <input
          type="text"
          placeholder="User ID"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
        />
        <button onClick={joinChannel}>Join Channel</button>
        <button onClick={leaveChannel}>Leave Channel</button>
      </div>
      <div>
        <video
          ref={(ref) => {
            if (ref && localVideoTrack) {
              localVideoTrack.play(ref);
            }
          }}
          autoPlay
          playsInline
          muted
        />
      </div>
      {remoteUsers.map((user) => (
        <div key={user.uid}>
          <video
            ref={(ref) => {
              if (ref) {
                user.videoTrack.play(ref);
              }
            }}
            autoPlay
            playsInline
          />
        </div>
      ))}
    </div>
  );
};

export default VideoCall;