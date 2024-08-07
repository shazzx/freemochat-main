import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    isAuthenticated: false,
    user: null,
    access_token: null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAccessToken(state, action){
            state.access_token = action.payload
        },
        loginSuccess(state, action) {
            state.isAuthenticated = true,
                state.user = action.payload
        },
        logout(state) {
            state.isAuthenticated = false,
                state.user = null
        }
    }
})

export const { loginSuccess, logout, setAccessToken } = authSlice.actions
export default authSlice.reducer