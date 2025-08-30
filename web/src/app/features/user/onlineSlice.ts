import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    isOnline : {},
}

const callSlice = createSlice({
    name: "online",
    initialState,
    reducers: {
        setOnline(state, action) {
            state.isOnline[action.payload] = true
        },

        setOffline(state, action) {
            state.isOnline[action.payload] = false
        },
    }
})

export const { setOffline, setOnline } = callSlice.actions
export default callSlice.reducer