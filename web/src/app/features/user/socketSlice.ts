import { createSlice } from "@reduxjs/toolkit"
import { Socket } from "socket.io-client"

const initialState: { socket: Socket } = {
    socket: null
}

const socketSlice = createSlice({
    name: 'socket',
    initialState,
    reducers: {
        setSocket(state, action) {
            state.socket = action.payload
        }
    }
})

export const { setSocket } = socketSlice.actions
export default socketSlice.reducer