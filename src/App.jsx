import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { getToken } from './lib/api.js';
import DashboardPage from './pages/DashboardPage.jsx';
import LoanDetailPage from './pages/LoanDetailPage.jsx';
import LoansPage from './pages/LoansPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MembersPage from './pages/MembersPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';

function ProtectedLayout() {
  return getToken() ? <Layout /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/loans/:id" element={<LoanDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
