import { CallStates, CallTypes } from "@/utils/enums/global.c"
import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    onCall: false,
    targtDetails: null,
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
        startCall(state, action) {
            state.onCall = true
            state.type = action.payload.type
            state.callerState = CallStates.CALLING
            state.targtDetails = action.payload.targtDetails
        },


        incomingCall(state, action) {
            state.onCall = true
            state.type = action.payload.type
            state.recepientState = CallStates.CALLING
            state.targtDetails = action.payload.targtDetails
        },

        
        acceptCall(state, action) {
            state.callDetails = action.payload
            state.recepientState = action.payload.recepientState
        },

        endCall(state) {
            state.onCall = false
            state.callDetails = null
        },
    }
})

export const { startCall, endCall } = callSlice.actions
export default callSlice.reducer