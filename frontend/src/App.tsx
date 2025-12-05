import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ClubSelection from './pages/ClubSelection';
import Home from './pages/Home';
import MemberManagement from './pages/MemberManagement';
import ScheduleList from './pages/ScheduleList';
import ScheduleCreation from './pages/ScheduleCreation';
import ScheduleGenerator from './pages/ScheduleGenerator';
import ScheduleDetail from './pages/ScheduleDetail';
import MemberStats from './pages/MemberStats';
import PublicSchedule from './pages/PublicSchedule';
import AuthCallback from './pages/AuthCallback';
import ClubMembers from './pages/ClubMembers';
import AdminDashboard from './pages/AdminDashboard';
import AdminClubMembers from './pages/AdminClubMembers';

function App() {
  return (
    <BrowserRouter basename="/confidential-tennis">
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/public/schedule/:publicLink" element={<PublicSchedule />} />
        
        {/* 공개 홈 페이지 */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
        </Route>
        
        {/* 인증 필요 라우트 */}
        <Route path="/" element={<Layout />}>
          <Route path="clubs" element={<ClubSelection />} />
          
          {/* 클럽 선택 필요 라우트 */}
          <Route
            path="members"
            element={
              <ProtectedRoute>
                <MemberManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="schedules"
            element={
              <ProtectedRoute>
                <ScheduleList />
              </ProtectedRoute>
            }
          />
          <Route
            path="schedule/new"
            element={
              <ProtectedRoute>
                <ScheduleCreation />
              </ProtectedRoute>
            }
          />
          <Route
            path="schedule/:scheduleId/generate"
            element={
              <ProtectedRoute>
                <ScheduleGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="schedule/:scheduleId/detail"
            element={
              <ProtectedRoute>
                <ScheduleDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="stats"
            element={
              <ProtectedRoute>
                <MemberStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="club-members"
            element={
              <ProtectedRoute>
                <ClubMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/clubs/:clubId/members"
            element={
              <ProtectedRoute>
                <AdminClubMembers />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
