import { io } from 'socket.io-client'
const url = import.meta.env.VITE_ENV == 'PRODUCTION' ? import.meta.env.VITE_APP_BASE_URL_PROD  : import.meta.env.VITE_APP_BASE_URL_DEV
let socket = io(url,{ path: '/api/socket', autoConnect: false })

export const socketConnect = (username: string) => {
    console.log(username, 'auth')
    socket.auth = { username }
    let connection = socket.connect()
    console.log(connection.connected)

    return socket
}