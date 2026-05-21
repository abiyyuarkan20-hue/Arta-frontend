import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Onboarding from "./pages/Onboarding";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Recommendations from "./pages/Recommendations";
import Forecasting from "./pages/Forecasting";
import Settings from "./pages/Settings";

// Komponen untuk melindungi rute yang butuh login
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        
        {/* Rute Onboarding */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } 
        />

        {/* Rute Aplikasi Utama (Diproteksi) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="forecasting" element={<Forecasting />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback ke Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
