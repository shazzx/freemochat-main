import { createSlice } from "@reduxjs/toolkit"

const initialState: {viewedPosts: String[]} = {
    viewedPosts: []
}

const viewedPostsSlice = createSlice({
    name: "viewedPosts",
    initialState,
    reducers: {
        insertViewedPost(state, action) {
            if(state.viewedPosts.includes(action.payload)){
                return
            }
            state.viewedPosts.push(action.payload)
        },

        emptyViewedPosts(state){
            state.viewedPosts = []
        }
    }
})

export const { insertViewedPost, emptyViewedPosts } = viewedPostsSlice.actions
export default viewedPostsSlice.reducer