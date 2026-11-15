import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { LiveProvider } from './context/LiveContext';
import Alerts from './pages/Alerts';
import Indicators from './pages/Indicators';
import Login from './pages/Login';
import Overview from './pages/Overview';
import Register from './pages/Register';
import Users from './pages/Users';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute><LiveProvider><Layout /></LiveProvider></ProtectedRoute>}>
        <Route path="/" element={<Overview />} />
        <Route path="/indicators" element={<Indicators />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/users" element={<ProtectedRoute roles={['ADMIN']}><Users /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}