import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import OAuthConsent from '@/pages/OAuthConsent';
import Benchmark from '@/pages/Benchmark';
import Camera from '@/pages/Camera';
import Wallet from '@/pages/Wallet';
import AnalyticsTraffic from '@/pages/AnalyticsTraffic';
import AIVideoStudio from '@/pages/AIVideoStudio';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import AIBuddy from '@/pages/AIBuddy';
import Onboarding from '@/pages/Onboarding';
import Dares from '@/pages/Dares';
import Truths from '@/pages/Truths';
import VideoScraper from '@/pages/VideoScraper';
import ViralVideoCreator from '@/pages/ViralVideoCreator';
import SyncDashboard from '@/pages/SyncDashboard';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* MCP OAuth consent page — mounted outside the app layout; it handles
          the signed-out case itself, so it must not sit behind an auth guard. */}
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route path="/Camera" element={<Camera />} />
      <Route path="/About" element={<About />} />
      <Route path="/Contact" element={<Contact />} />
      <Route path="/AIBuddy" element={
        <LayoutWrapper currentPageName="AIBuddy">
          <AIBuddy />
        </LayoutWrapper>
      } />
      <Route path="/Onboarding" element={
        <LayoutWrapper currentPageName="Onboarding">
          <Onboarding />
        </LayoutWrapper>
      } />
      <Route path="/Dares" element={
        <LayoutWrapper currentPageName="Dares">
          <Dares />
        </LayoutWrapper>
      } />
      <Route path="/Truths" element={
        <LayoutWrapper currentPageName="Truths">
          <Truths />
        </LayoutWrapper>
      } />
      <Route path="/VideoScraper" element={
        <LayoutWrapper currentPageName="VideoScraper">
          <VideoScraper />
        </LayoutWrapper>
      } />
      <Route path="/ViralVideoCreator" element={
        <LayoutWrapper currentPageName="ViralVideoCreator">
          <ViralVideoCreator />
        </LayoutWrapper>
      } />
      <Route path="/SyncDashboard" element={
        <LayoutWrapper currentPageName="SyncDashboard">
          <SyncDashboard />
        </LayoutWrapper>
      } />
      <Route path="/Benchmark" element={
        <LayoutWrapper currentPageName="Benchmark">
          <Benchmark />
        </LayoutWrapper>
      } />
      <Route path="/Wallet" element={
        <LayoutWrapper currentPageName="Wallet">
          <Wallet />
        </LayoutWrapper>
      } />
      <Route path="/AnalyticsTraffic" element={
        <LayoutWrapper currentPageName="AnalyticsTraffic">
          <AnalyticsTraffic />
        </LayoutWrapper>
      } />
      <Route path="/AIVideoStudio" element={
        <LayoutWrapper currentPageName="AIVideoStudio">
          <AIVideoStudio />
        </LayoutWrapper>
      } />
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App