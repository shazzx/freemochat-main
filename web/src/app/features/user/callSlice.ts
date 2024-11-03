import { CallStates, CallTypes } from "@/utils/enums/global.c"
import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    onCall: false,
    targetDetails: null,
    callerState: null,
    recepientState: null,
    callDetails: null,
    type: null,
    // caller: null,
    // recepient: null,
}

const callSlice = createSlice({
    name: "call",
    initialState,
    reducers: {
        // caller
        startCall(state, action) {
            state.onCall = true
            state.type = action.payload.type
            state.callerState = CallStates.CALLING
            state.targetDetails = action.payload.targetDetails
        },


        setAcceptedCallState(state, action) {
            // state.callDetails = action.payload
        },


        // recep

        callRinging(state) {
            state.recepientState = CallStates.RINGING
        },

        incomingCall(state, action) {
            state.onCall = true
            state.type = action.payload.type
            state.recepientState = CallStates.CALLING
            state.callDetails = action.payload.callDetails
        },


        acceptCall(state, action) {
            state.callDetails = action.payload.callDetails
            state.callerState = CallStates.ACCEPTED
            state.recepientState = CallStates.ACCEPTED
        },

        // both
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