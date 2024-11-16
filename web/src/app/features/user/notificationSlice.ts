import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    notification: false
}

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        setNewNotification(state) {
            state.notification = true
        },
        setNotifcationSeen(state) {
            state.notification = false
        }
    }
})

export const { setNewNotification, setNotifcationSeen } = notificationSlice.actions
export default notificationSlice.reducer