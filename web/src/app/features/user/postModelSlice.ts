import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    isOpen: false,
    id: null,
    click: null,
}
const postModelSlice = createSlice({
    name: "isOpen",
    initialState,
    reducers: {
        setOpen(state, action) {
            state.isOpen = true
            state.id = action.payload.id
            state.click = action.payload.click
        },
        setClose(state){
            state.isOpen = false
            state.id = null
        }
    }
})

export const { setOpen, setClose } = postModelSlice.actions
export default postModelSlice.reducer