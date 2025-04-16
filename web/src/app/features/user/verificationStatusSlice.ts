import { createSlice } from "@reduxjs/toolkit"

const initialState: {
    verificationStatus: { isEmailVerified: boolean, success: boolean }
} = {
    verificationStatus: {
        isEmailVerified: false,
        success: false,
    }
}

const verificationStatusSlice = createSlice({
    name: "verificationStatus",
    initialState,
    reducers: {
        setVerificationStatus(state, action) {
            state.verificationStatus = { ...state.verificationStatus, ...action.payload }
        },
        resetVerificatoinStatus(state, action) {
            state.verificationStatus = null
        },
    }
})

export const { setVerificationStatus, resetVerificatoinStatus } = verificationStatusSlice.actions
export default verificationStatusSlice.reducer