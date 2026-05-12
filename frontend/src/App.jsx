import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider }  from "./context/CartContext";
import Navbar         from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// ── Existing pages (keep as-is) ──
import HomePage      from "./pages/HomePage";
import LoginPage     from "./pages/LoginPage";
import RegisterPage  from "./pages/RegisterPage";
import AnalysisPage  from "./pages/AnalysisPage";
import CartPage      from "./pages/CartPage";
import CheckoutPage  from "./pages/CheckoutPage";
import CoachPage     from "./pages/CoachPage";
import DashboardPage from "./pages/DashboardPage";

// ── New pages ──
import DailyAnalysisPage  from "./pages/DailyAnalysisPage";
import NotificationsPage  from "./pages/NotificationsPage";
import HistoryPage        from "./pages/HistoryPage";
import PointsPage        from "./pages/PointsPage";
import WeatherPage        from "./pages/WeatherPage";
import AgingTrajectoryPage from "./pages/AgingTrajectoryPage";

/*
  Layout wrapper — renders the fixed Navbar then the page content
  with enough top-padding to clear the 72px navbar.
*/
const WithNav = ({ children }) => (
  <>
    <Navbar />
    <div style={{ paddingTop: "72px", minHeight: "calc(100vh - 72px)" }}>
      {children}
    </div>
  </>
);

const App = () => (
  <AuthProvider>
    <CartProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Full-screen auth pages (no Navbar) ── */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Public landing page ── */}
          <Route path="/" element={<WithNav><HomePage /></WithNav>} />

          {/* ── Protected pages ── */}
          <Route path="/analyze" element={
            <ProtectedRoute><WithNav><AnalysisPage /></WithNav></ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute><WithNav><DashboardPage /></WithNav></ProtectedRoute>
          } />
          <Route path="/coach" element={
            <ProtectedRoute><WithNav><CoachPage /></WithNav></ProtectedRoute>
          } />
          <Route path="/daily" element={
            <ProtectedRoute><WithNav><DailyAnalysisPage /></WithNav></ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute><WithNav><NotificationsPage /></WithNav></ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute><WithNav><HistoryPage /></WithNav></ProtectedRoute>
          } />
          <Route path="/points" element={
            <ProtectedRoute><WithNav><PointsPage /></WithNav></ProtectedRoute>
          } />
          <Route path="/rewards" element={
            <ProtectedRoute><WithNav><PointsPage /></WithNav></ProtectedRoute>
          } />
          <Route path="/weather" element={
            <ProtectedRoute><WithNav><WeatherPage /></WithNav></ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute><WithNav><CartPage /></WithNav></ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute><WithNav><CheckoutPage /></WithNav></ProtectedRoute>
          } />
          <Route path="/aging" element={
            <ProtectedRoute><WithNav><AgingTrajectoryPage /></WithNav></ProtectedRoute>
          } />
          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </CartProvider>
  </AuthProvider>
);

export default App;