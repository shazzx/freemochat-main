import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import FeedSection from "./sections/FeedSection";
import MainHome from "./components/MainHome";
import MessagesSection from "./sections/MessagesSection";
import PagesSection from "./sections/PagesSection";
import Groups from "./sections/GroupSection";
import Bookmarked from "./sections/BookmarkedSection";
import CampaignSection from "./sections/CampaignSection";
import AuthVerificationForm from "./components/Auth/AuthVerificationForm";
import ProfilePage from "./pages/user/ProfilePage";
import GroupProfile from "./components/GroupProfile";
import PageProfile from "./components/PageProfile";
import ManageGroups from "./sections/ManageGroups";
import PostSection from "./sections/PostSection";
import { LoginForm } from "./components/Login";
import PublicRoute from "./components/PublicRoute";
import { Signup } from "./components/Signup";
import ManagePages from "./sections/ManagePages";
import SearchSection from "./sections/SearchSection";
import YourAccount from "./components/YourAccount";
import ForgetPassword from "./components/ForgetPassword";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <ProtectedRoute />,
        children: [
            {
                path: "/",
                element: <MainHome children={<FeedSection/>} />,
                index: true
            },
            {
                path: "/login",
                element: <LoginForm/>,
            },
            {
                path: "/messages",
                element: <MainHome children={<MessagesSection/>} />,
            },
            {
                path: "/pages",
                element: <MainHome children={<PagesSection/>} />,
            },
            {
                path: "/groups",
                element: <MainHome children={<Groups/>} />,
            },
            {
                path: "/bookmarked",
                element: <MainHome children={<Bookmarked/>} />,
            },
            {
                path: "/campaigns",
                element: <MainHome children={<CampaignSection/>} />,
            },
            {
                path: "/profile",
                element: <MainHome children={<ProfilePage role={"self"} />} />,
            },
            {
                path: "/user/:username",
                element: <MainHome children={<ProfilePage />} />,
            },
            {
                path: "/group/:handle",
                element: <MainHome children={<GroupProfile />} />,
            },
            {
                path: "/page/:handle",
                element: <MainHome children={<PageProfile />} />,
            },
            {
                path: "/manage/groups",
                element: <MainHome children={<ManageGroups />} />,
            },
            {
                path: "/manage/pages",
                element: <MainHome children={<ManagePages />} />,
            },
            {
                path: "/post/:post",
                element: <MainHome children={<PostSection />} />,
            },

            {
                path: "/search",
                element: <MainHome children={<SearchSection />} />,
            },
        ] 
    },
    {
                path: "/",
        element: <PublicRoute />,
        children: [
            {
                path: "/login",
                element: <LoginForm/>,
                index: true
            },
            {
                path: "/auth/:username",
                element: <AuthVerificationForm />,
            },
            {
                path: "/signup",
                element: <Signup/>,
            },
            {
                path: "/forget-password",
                element: <YourAccount/>,
            },
            {
                path: "/reset-password/:auth",
                element: <ForgetPassword/>,
            },
        ],

    }
])
