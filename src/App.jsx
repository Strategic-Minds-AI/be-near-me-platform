import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import ErrorBoundary from '@/components/ErrorBoundary'
import Layout from './Layout.jsx'
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
import DomainOps from '@/pages/DomainOps';
import VideoLibrary from '@/pages/VideoLibrary';
import PictureToVideo from '@/pages/PictureToVideo';
import MediaKit from '@/pages/MediaKit';
import Splash from '@/pages/Splash';
import BnmDiscover from '@/pages/BnmDiscover';
import BnmEffects from '@/pages/BnmEffects';
import BnmInbox from '@/pages/BnmInbox';
import BnmMessages from '@/pages/BnmMessages';
import BnmMenu from '@/pages/BnmMenu';
import BnmTracker from '@/pages/BnmTracker';
import FactoryBuilder from '@/pages/FactoryBuilder';
import FactoryDashboard from '@/pages/FactoryDashboard';
import VisualGallery from '@/pages/VisualGallery';
import BnmLockedHome from '@/pages/BnmLockedHome';
import BnmLockedNearby from '@/pages/BnmLockedNearby';
import BnmLockedChallenge from '@/pages/BnmLockedChallenge';
import BnmLockedSearch from '@/pages/BnmLockedSearch';
import BnmLockedProfile from '@/pages/BnmLockedProfile';
import BnmLockedCreatorStudio from '@/pages/BnmLockedCreatorStudio';
import BnmLockedAiCoach from '@/pages/BnmLockedAiCoach';
import BnmLockedRewards from '@/pages/BnmLockedRewards';
import BnmLockedCheckout from '@/pages/BnmLockedCheckout';
import BnmLockedCreate from '@/pages/BnmLockedCreate';
import BnmLegacy from '@/pages/BnmLegacy';

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
      <Route path="/DomainOps" element={
        <LayoutWrapper currentPageName="DomainOps">
          <DomainOps />
        </LayoutWrapper>
      } />
      <Route path="/VideoLibrary" element={
        <LayoutWrapper currentPageName="VideoLibrary">
          <VideoLibrary />
        </LayoutWrapper>
      } />
      <Route path="/PictureToVideo" element={
        <LayoutWrapper currentPageName="PictureToVideo">
          <PictureToVideo />
        </LayoutWrapper>
      } />
      <Route path="/MediaKit" element={
        <LayoutWrapper currentPageName="MediaKit">
          <MediaKit />
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
      <Route path="/" element={<Splash />} />
      <Route path="/home" element={<BnmLockedHome />} />
      <Route path="/discover" element={<BnmDiscover />} />
      <Route path="/create" element={<BnmLockedCreate />} />
      <Route path="/tracker" element={<BnmTracker />} />
      <Route path="/camera" element={<BnmLockedCreate />} />
      <Route path="/effects" element={<BnmEffects />} />
      <Route path="/nearby" element={<BnmLockedNearby />} />
      <Route path="/challenge" element={<BnmLockedChallenge />} />
      <Route path="/challenge/:challengeId" element={<BnmLockedChallenge />} />
      <Route path="/search" element={<BnmLockedSearch />} />
      <Route path="/profile" element={<BnmLockedProfile />} />
      <Route path="/creator-studio" element={<BnmLockedCreatorStudio />} />
      <Route path="/ai-coach" element={<BnmLockedAiCoach />} />
      <Route path="/rewards" element={<BnmLockedRewards />} />
      <Route path="/reward-checkout" element={<BnmLockedCheckout />} />
      <Route path="/reward-checkout/:rewardId" element={<BnmLockedCheckout />} />
      <Route path="/legacy" element={<BnmLegacy />} />
      <Route path="/inbox" element={<BnmInbox />} />
      <Route path="/messages" element={<BnmMessages />} />
      <Route path="/menu" element={<BnmMenu />} />
      <Route path="/builder" element={<FactoryBuilder />} />
      <Route path="/factory" element={<FactoryDashboard />} />
      <Route path="/gallery" element={
        <LayoutWrapper currentPageName="VisualGallery">
          <VisualGallery />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ErrorBoundary>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <VisualEditAgent />
        </ErrorBoundary>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App