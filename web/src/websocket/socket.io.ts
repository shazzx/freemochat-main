import { io } from 'socket.io-client'
let socket = io("http://localhost:3000", { autoConnect: false })

export const socketConnect = (username: string) => {
    console.log(username, 'auth')
    socket.auth = { username }
    socket.connect()

    return socket
}