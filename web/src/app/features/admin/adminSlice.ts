import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    admin: null,
}

const adminSlice = createSlice({
    name: "admin",
    initialState,
    reducers: {
        setAdmin(state, action) {
            state.admin = action.payload
        },
        updateAdmin(state, action) {
            state.admin = action.payload
        },
        updateProfile(state, action) {
            if(!state.admin?.profile){
                state.admin = {...state.admin, profile: action.payload}
                return 
            }
            state.admin.images.profile = action.payload
        },
    }
})

export const { setAdmin, updateAdmin, updateProfile } = adminSlice.actions
export default adminSlice.reducer