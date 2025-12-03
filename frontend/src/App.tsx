import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import MemberManagement from './pages/MemberManagement';
import ScheduleCreation from './pages/ScheduleCreation';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="members" element={<MemberManagement />} />
          <Route path="schedule/new" element={<ScheduleCreation />} />
          {/* 추후 추가될 라우트 */}
          <Route path="history" element={<div>기록 보기 (준비 중)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
