// import React, { useEffect, useState } from 'react';
// import AgoraRTC from 'agora-rtc-react';

// const TestVideo = () => {
//   const [appId, setAppId] = useState('f41145d4d6fa4a3caab3104ac89622ec');
//   const [channel, setChannel] = useState('test');
//   const [token, setToken] = useState(null);
//   const [user, setUser] = useState('');
//   const [remoteUsers, setRemoteUsers] = useState([]);

//   useEffect(() => {
//     // Replace this with your token generation logic
//     setToken(null);
//   }, []);

//   const handleUserJoined = (user, mediaType) => {
//     setRemoteUsers((prevUsers) => [...prevUsers, user]);
//   };

//   const handleUserLeft = (user) => {
//     setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
//   };

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//       <h1>Video Call</h1>
//       <input
//         type="text"
//         placeholder="Enter your name"
//         value={user}
//         onChange={(e) => setUser(e.target.value)}
//       />
//       <AgoraRTC
//         appId={appId}
//         channel={channel}
//         token={token}
//         videoCall={true}
//         audioCall={true}
//         user={user}
//         style={{ width: '640px', height: '480px' }}
//         onUserJoined={handleUserJoined}
//         onUserLeft={handleUserLeft}
//       >
//         {remoteUsers.map((user) => (
//           <AgoraRTC
//             key={user.uid}
//             videoCall={true}
//             audioCall={true}
//             user={user}
//             style={{ width: '320px', height: '240px' }}
//           />
//         ))}
//       </AgoraRTC>
//     </div>
//   );
// };

// export default TestVideo;