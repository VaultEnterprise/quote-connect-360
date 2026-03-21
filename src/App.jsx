import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Cases from '@/pages/Cases';
import CaseDetail from '@/pages/CaseDetail';
import CaseNew from '@/pages/CaseNew';
import Census from '@/pages/Census';
import Quotes from '@/pages/Quotes.jsx';
import Enrollment from '@/pages/Enrollment';
import Renewals from '@/pages/Renewals';
import Tasks from '@/pages/Tasks';
import Settings from '@/pages/Settings';
import Employers from '@/pages/Employers';
import PlanLibrary from '@/pages/PlanLibrary';
import ProposalBuilder from '@/pages/ProposalBuilder';
import ExceptionQueue from '@/pages/ExceptionQueue';
import ContributionModeling from '@/pages/ContributionModeling';
import EmployeePortal from '@/pages/EmployeePortal';
import EmployerPortal from '@/pages/EmployerPortal';
import PolicyMatchAI from '@/pages/PolicyMatchAI';
import IntegrationInfrastructure from '@/pages/IntegrationInfrastructure';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading Connect Quote 360...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/new" element={<CaseNew />} />
        <Route path="/cases/:id" element={<CaseDetail />} />
        <Route path="/census" element={<Census />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/enrollment" element={<Enrollment />} />
        <Route path="/renewals" element={<Renewals />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/employers" element={<Employers />} />
        <Route path="/plans" element={<PlanLibrary />} />
        <Route path="/proposals" element={<ProposalBuilder />} />
        <Route path="/exceptions" element={<ExceptionQueue />} />
        <Route path="/contributions" element={<ContributionModeling />} />
        <Route path="/employee-portal" element={<EmployeePortal />} />
        <Route path="/employer-portal" element={<EmployerPortal />} />
        <Route path="/policymatch" element={<PolicyMatchAI />} />
        <Route path="/integration-infra" element={<IntegrationInfrastructure />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App