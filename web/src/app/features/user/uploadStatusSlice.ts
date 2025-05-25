import { createSlice } from "@reduxjs/toolkit";

const uploadStatusSlice = createSlice({
    initialState: { isUploading: false, type: '', message: '' },
    name: "uploadStatus",
    reducers: {
        createUploadStatus(state, action) {
            state.isUploading = true
            state.type = 'reels'
            state.message = action.payload
        },
        removeUploadStatus(state) {
            state.isUploading = false
            state.type = ''
            state.message = ''
        }
    }
})

export const { createUploadStatus, removeUploadStatus } = uploadStatusSlice.actions
export default uploadStatusSlice.reducer