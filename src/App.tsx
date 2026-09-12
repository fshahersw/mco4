import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext";
import AppShell from "./components/layout/AppShell";
import DashboardPage from "./pages/DashboardPage";
import CasesPage from "./pages/CasesPage";
import CaseDetailPage from "./pages/CaseDetailPage";
import DocketActivityPage from "./pages/DocketActivityPage";
import DocumentsPage from "./pages/DocumentsPage";
import CalendarPage from "./pages/CalendarPage";
import DeadlinesPage from "./pages/DeadlinesPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import RulesLibraryPage from "./pages/RulesLibraryPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  const { role } = useApp();
  const canAnalytics = role === "Admin" || role === "Managing Clerk";
  const isAdmin = role === "Admin";

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:id" element={<CaseDetailPage />} />
        <Route path="/records" element={<Navigate to="/cases" replace />} />
        <Route path="/docket" element={<DocketActivityPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/deadlines" element={<DeadlinesPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/analytics" element={canAnalytics ? <AnalyticsPage /> : <Navigate to="/" replace />} />
        <Route path="/rules" element={<RulesLibraryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={isAdmin ? <AdminPage /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
