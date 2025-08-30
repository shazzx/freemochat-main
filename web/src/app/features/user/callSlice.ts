import { CallStates, CallTypes } from "@/utils/enums/global.c"
import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    onCall: false,
    targetDetails: null,
    callerState: null,
    recepientState: null,
    callDetails: null,
    type: null,
    isMobile: false,
}

const callSlice = createSlice({
    name: "call",
    initialState,
    reducers: {
        startCall(state, action) {
            state.onCall = true
            state.type = action.payload.type
            state.callerState = CallStates.CALLING
            state.targetDetails = action.payload.targetDetails
        },

        callRinging(state) {
            state.recepientState = CallStates.RINGING
        },

        incomingCall(state, action) {
            state.onCall = true
            state.type = action.payload.type
            state.recepientState = CallStates.CALLING
            state.callDetails = action.payload.callDetails
            state.isMobile = action.payload?.isMobile ?? false
        },


        acceptCall(state, action) {
            state.callDetails = action.payload.callDetails
            state.callerState = CallStates.ACCEPTED
            state.recepientState = CallStates.ACCEPTED
            if (!state.isMobile) {
                state.isMobile = action.payload?.isMobile ?? false
            }
        },

        endCall(state) {
            state.onCall = false
            state.targetDetails = null
            state.callerState = null
            state.recepientState = null
            state.callDetails = null
            state.type = null
        },
    }
})

export const { startCall, incomingCall, callRinging, acceptCall, endCall } = callSlice.actions
export default callSlice.reducer