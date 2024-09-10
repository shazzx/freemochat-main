import { io } from 'socket.io-client'
const url = process.env.ENV == 'PRODUCTION' ? 'http://ec2-15-206-203-226.ap-south-1.compute.amazonaws.com:3000' : 'http://localhost:3000'
let socket = io(url, { autoConnect: false })

export const socketConnect = (username: string) => {
    console.log(username, 'auth')
    socket.auth = { username }
    socket.connect()

    return socket
}