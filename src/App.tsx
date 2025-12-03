import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Auth from "./pages/Auth";
import Apply from "./pages/Apply";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import CandidateProfile from "./pages/CandidateProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import JobsList from "./pages/admin/JobsList";
import JobEditor from "./pages/admin/JobEditor";
import BusinessCaseEditor from "./pages/admin/BusinessCaseEditor";
import DepartmentsManager from "./pages/admin/DepartmentsManager";
import UsersManager from "./pages/admin/UsersManager";
import AnalyticsDashboard from "./pages/admin/AnalyticsDashboard";
import RecruiterJobsList from "./pages/recruiter/RecruiterJobsList";
import RecruiterJobEditor from "./pages/recruiter/RecruiterJobEditor";
import RecruiterBusinessCase from "./pages/recruiter/RecruiterBusinessCase";
import RecruiterAnalytics from "./pages/recruiter/RecruiterAnalytics";
import CandidatesEvaluation from "./pages/recruiter/CandidatesEvaluation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/apply/:id" element={<Apply />} />
            <Route path="/dashboard" element={<RecruiterDashboard />} />
            <Route path="/dashboard/candidate/:applicationId" element={<CandidateProfile />} />
            {/* Recruiter Jobs Routes */}
            <Route path="/dashboard/jobs" element={<RecruiterJobsList />} />
            <Route path="/dashboard/jobs/new" element={<RecruiterJobEditor />} />
            <Route path="/dashboard/jobs/:id/edit" element={<RecruiterJobEditor />} />
            <Route path="/dashboard/jobs/:id/business-case" element={<RecruiterBusinessCase />} />
            <Route path="/dashboard/analytics" element={<RecruiterAnalytics />} />
            <Route path="/dashboard/evaluate" element={<CandidatesEvaluation />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/jobs" element={<JobsList />} />
            <Route path="/admin/jobs/new" element={<JobEditor />} />
            <Route path="/admin/jobs/:id/edit" element={<JobEditor />} />
            <Route path="/admin/jobs/:id/business-case" element={<BusinessCaseEditor />} />
            <Route path="/admin/departments" element={<DepartmentsManager />} />
            <Route path="/admin/users" element={<UsersManager />} />
            <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;