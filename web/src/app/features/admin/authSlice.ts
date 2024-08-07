import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    access_token: null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAccessToken(state, action) {
            state.access_token = action.payload
        },
    }
})

export const { setAccessToken } = authSlice.actions
export default authSlice.reducer