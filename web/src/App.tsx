import { Route, Routes } from 'react-router-dom'
import { ThemeProvider } from "@/components/theme-provider"
import MainHome from './components/MainHome'
import FeedSection from './sections/FeedSection'
import { AdminDashboard } from './admin/AdminDashboard'
import DashboardSection from './admin/sections/Dashboard'
import UsersSection from './admin/sections/Users'
import GroupsSection from './admin/sections/Groups'
import ReportsSection from './admin/sections/Reports.'
import PostsSection from './admin/sections/PostsSection'
import Campaigns from './admin/sections/Campaigns'
import ProfilePage from './pages/user/ProfilePage'
import MessagesSection from './sections/MessagesSection'
import Groups from './sections/GroupSection'
import Bookmarked from './sections/BookmarkedSection'
import { Signup } from './components/Signup'
import { LoginForm } from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import SearchSection from './sections/SearchSection'
import GroupProfile from './components/GroupProfile'
import PageProfile from './components/PageProfile'
import Toast from './components/Toast'
import { ManageGroups } from './sections/ManageGroups'
import ManagePages from './sections/ManagePages'
import Pages from './admin/sections/Pages'
import PagesSection from './sections/PagesSection'
import { AdminLogin } from './admin/pages/Login'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import CampaignSection from './sections/CampaignSection'

function App() {

  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/search" element={
            <ProtectedRoute>
              <MainHome children={<SearchSection />} />
            </ProtectedRoute>}
          />

          <Route path='/profile'
            element={
              <ProtectedRoute >
                <MainHome children={<ProfilePage role={'self'} />} />
              </ProtectedRoute>}
          />

          <Route path='/user/:username'
            element={
              <ProtectedRoute >
                <MainHome children={<ProfilePage />} />
              </ProtectedRoute>}
          />

          <Route path='/group/:handle'
            element={
              <ProtectedRoute >
                <MainHome children={<GroupProfile />} />
              </ProtectedRoute>}
          />

          <Route path='/page/:handle'
            element={
              <ProtectedRoute >
                <MainHome children={<PageProfile />} />
              </ProtectedRoute>}
          />

          <Route path='/'
            element={
              <ProtectedRoute>
                <MainHome children={<FeedSection />} />
              </ProtectedRoute>
            } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <MainHome children={<MessagesSection />} />
            </ProtectedRoute>
          } />


          <Route path='/groups'
            element={
              <ProtectedRoute>
                <MainHome children={<Groups />} />
              </ProtectedRoute>
            }
          />

          <Route path='/manage/groups'
            element={
              <ProtectedRoute>
                <MainHome children={<ManageGroups />} />
              </ProtectedRoute>
            }
          />

          <Route path='/pages'
            element={
              <ProtectedRoute>
                <MainHome children={<PagesSection />} />
              </ProtectedRoute>
            } />


          <Route path='/manage/pages'
            element={
              <ProtectedRoute>
                <MainHome children={<ManagePages />} />
              </ProtectedRoute>
            } />

          <Route path="/bookmarked" element={
            <ProtectedRoute >
              <MainHome children={<Bookmarked />} />
            </ProtectedRoute>} />

          <Route path="/campaigns" element={
            <ProtectedRoute >
              <MainHome children={<CampaignSection />} />
            </ProtectedRoute>}
          />

          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<LoginForm />} />
  

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminProtectedRoute children={<AdminDashboard Section={<DashboardSection />} />} />} />
          <Route path="/admin/users" element={<AdminProtectedRoute children={<AdminDashboard Section={<UsersSection />} />} />} />
          <Route path="/admin/posts" element={<AdminProtectedRoute children={<AdminDashboard Section={<PostsSection />} />} />} />
          <Route path="/admin/groups" element={<AdminProtectedRoute children={<AdminDashboard Section={<GroupsSection />} />} />} />
          <Route path="/admin/pages" element={<AdminProtectedRoute children={<AdminDashboard Section={<Pages />} />} />} />
          <Route path="/admin/reports" element={<AdminProtectedRoute children={<AdminDashboard Section={<ReportsSection />} />} />} />
          <Route path="/admin/campaigns" element={<AdminProtectedRoute children={<AdminDashboard Section={<Campaigns />} />} />} />
          <Route path="/admin/login" element={<AdminLogin />} />


          {/* <Route path="/videocallcomp" element={<VideoCallUI/>} /> */}


          {/* testing */}
        </Routes>
        <Toast />
      </ThemeProvider>
    </>
  )
}

export default App
