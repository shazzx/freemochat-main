import { io, Socket } from 'socket.io-client';

const url = import.meta.env.VITE_ENV == 'PRODUCTION' ? import.meta.env.VITE_APP_BASE_URL_PROD : import.meta.env.VITE_APP_BASE_URL_DEV

const SOCKET_CONFIG = {
    path: "/api/socket",
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 3000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 10000,
}

class SocketManager {
    private socket: Socket | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private maxReconnectAttempts = 5;
    private currentReconnectAttempts = 0;

    constructor(private serverUrl: string) { }

    connect(username?: string): Socket {
        if (this.socket) {
            return this.socket;
        }

        this.socket = io(this.serverUrl, SOCKET_CONFIG);

        if (username) {
            this.socket.auth = { username };
        }

        this.setupEventListeners();
        this.socket.connect();

        return this.socket;
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Socket connected successfully');
            this.currentReconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log(`Socket disconnected: ${reason}`);
            this.handleDisconnect(reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.handleConnectionError(error);
        });

        // Handle timeout specifically
        this.socket.on('error', (error: Error) => {
            if (error.message.includes('timeout')) {
                console.error('Socket timeout occurred');
                this.handleTimeout();
            }
        });
    }

    private handleDisconnect(reason: string) {
        if (reason === 'io server disconnect') {
            // Server disconnected us, try to reconnect immediately
            this.socket?.connect();
        } else if (reason === 'transport close' || reason === 'ping timeout') {
            // Network issues, attempt reconnect with backoff
            this.attemptReconnect();
        }
    }

    private handleConnectionError(error: Error) {
        console.error('Connection error:', error);
        if (error.message.includes('timeout')) {
            this.handleTimeout();
        } else {
            this.attemptReconnect();
        }
    }

    private handleTimeout() {
        if (this.socket?.connected) {
            this.socket.disconnect();
        }
        this.attemptReconnect();
    }

    private attemptReconnect() {
        if (this.currentReconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.cleanup();
            return;
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.currentReconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.currentReconnectAttempts), 10000);

        this.reconnectTimer = setTimeout(() => {
            console.log(`Attempting reconnect ${this.currentReconnectAttempts}/${this.maxReconnectAttempts}`);
            this.socket?.connect();
        }, delay);
    }

    private cleanup() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.socket?.removeAllListeners();
        this.socket?.close();
        this.socket = null;
    }

    disconnect() {
        this.cleanup();
    }
}

// Usage example
const socketManager = new SocketManager(url);

export const socketConnect = (username?: string): Socket => {
    return socketManager.connect(username);
};


export const socketDisconnect = () => {
    return socketManager.disconnect();
};

// const url = import.meta.env.VITE_ENV == 'PRODUCTION' ? import.meta.env.VITE_APP_BASE_URL_PROD : import.meta.env.VITE_APP_BASE_URL_DEV
// let socket = io(url, {
//     path: "/api/socket",
//     autoConnect: false,
//     forceNew: true,
//     reconnection: true,
//     reconnectionAttempts: Infinity,
//     reconnectionDelay: 1000,
//     reconnectionDelayMax: 5000

// })

// export const socketConnect = (username: string) => {
//     if (!username) return socket;

//     socket.auth = { username };

//     // socket.on('disconnect', (reason) => {
//     //     console.log(`Socket disconnected: ${reason}`);

//     //     if (reason === 'io server disconnect') {
//     //         socket.connect();
//     //     }
//     // });

//     socket.connect();

//     socket.on('connect', () => {
//         console.log(`Socket connected for user: ${username}`);
//     });

//     socket.on('connect_error', (error) => {
//         console.error('Socket connection error:', error);
//     });

//     return socket
// }

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