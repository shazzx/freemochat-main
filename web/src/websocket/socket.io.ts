import { io } from 'socket.io-client'
const url = import.meta.env.VITE_ENV == 'PRODUCTION' ? import.meta.env.VITE_APP_BASE_URL_PROD : import.meta.env.VITE_APP_BASE_URL_DEV
let socket = io(url, {
    path: "/api/socket",
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000

})

export const socketConnect = (username: string) => {
    if (!username) return socket;

    socket.auth = { username };

    socket.on('disconnect', (reason) => {
        console.log(`Socket disconnected: ${reason}`);

        // Attempt to reconnect manually
        if (reason === 'io server disconnect') {
            // If disconnected by the server, manually reconnect
            socket.connect();
        }
    });

    socket.connect();  // Initial connection

    socket.on('connect', () => {
        console.log(`Socket connected for user: ${username}`);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket
}

// export const socketConnect = (username?: string) => {
//     if (!username) return socket;

//     socket.auth = { username };

//     socket.on('disconnect', (reason) => {
//         console.log(`Socket disconnected: ${reason}`);

//         // Attempt to reconnect manually
//         if (reason === 'io server disconnect') {
//             // If disconnected by the server, manually reconnect
//             socket.connect();
//         }
//     });

//     socket.connect();  // Initial connection

//     socket.on('connect', () => {
//         console.log(`Socket connected for user: ${username}`);
//     });

//     socket.on('connect_error', (error) => {
//         console.error('Socket connection error:', error);
//     });

//     return socket;
// }