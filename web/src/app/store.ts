import { configureStore } from "@reduxjs/toolkit";
import authReducer from './features/user/authSlice'
import userReducer from './features/user/userSlice'
import searchReducer from './features/user/searchSlice'
import socketReducer from './features/user/socketSlice'
import callReducer from './features/user/callSlice'
import viewedPostsReducer from './features/user/viewPostSlice'
import notificationReducer from './features/user/notificationSlice'
import verificationStatusReducer from './features/user/verificationStatusSlice'
import onlineReducer from './features/user/onlineSlice'
import postModelReducer from './features/user/postModelSlice'
import adminAuthReducer from './features/admin/authSlice'
import adminReducer from './features/admin/adminSlice'

export const store = configureStore({
    reducer: {
        adminAuth: adminAuthReducer,
        admin: adminReducer,
        user: userReducer,
        auth: authReducer,
        notification: notificationReducer,
        search: searchReducer,
        call: callReducer,
        verificationStatus: verificationStatusReducer,
        viewedPosts: viewedPostsReducer,
        postModel: postModelReducer,
        online: onlineReducer,
        socket: socketReducer,
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
