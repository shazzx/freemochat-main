import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    user: null,
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser(state, action) {
            state.user = action.payload
        },
        updateUser(state, action) {
            state.user = {...state.user, ...action.payload}
        },
        updateProfile(state, action) {
            if(!state.user.profile){
                state.user = {...state.user, profile: action.payload}
                return 
            }
            state.user.profile = action.payload
        },
        updateCover(state, action) {
            if(!state.user.cover){
                state.user = {...state.user, cover: action.payload}
                return 
            }
            state.user.cover = action.payload
        }
    }
})

export const { setUser, updateUser, updateProfile, updateCover } = userSlice.actions
export default userSlice.reducer