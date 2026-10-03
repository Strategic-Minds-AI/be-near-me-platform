import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import ErrorBoundary from '@/components/ErrorBoundary'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import OAuthConsent from '@/pages/OAuthConsent';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Splash from '@/pages/Splash';
import BnmDiscover from '@/pages/BnmDiscover';
import BnmEffects from '@/pages/BnmEffects';
import BnmInbox from '@/pages/BnmInbox';
import BnmMessages from '@/pages/BnmMessages';
import BnmMenu from '@/pages/BnmMenu';
import BnmTracker from '@/pages/BnmTracker';
import BnmLockedHome from '@/pages/BnmLockedHome';
import BnmLockedNearby from '@/pages/BnmLockedNearby';
import BnmLockedChallenge from '@/pages/BnmLockedChallenge';
import BnmLockedSearch from '@/pages/BnmLockedSearch';
import BnmLockedProfile from '@/pages/BnmLockedProfile';
import BnmLockedCreateChannel from '@/pages/BnmLockedCreateChannel';
import BnmLockedSettings from '@/pages/BnmLockedSettings';
import BnmLockedCreatorStudio from '@/pages/BnmLockedCreatorStudio';
import BnmLockedAiCoach from '@/pages/BnmLockedAiCoach';
import BnmLockedRewards from '@/pages/BnmLockedRewards';
import BnmLockedCheckout from '@/pages/BnmLockedCheckout';
import BnmLockedCreate from '@/pages/BnmLockedCreate';
import BnmLockedUpload from '@/pages/BnmLockedUpload';
import BnmLockedWatch from '@/pages/BnmLockedWatch';
import BnmLockedLive from '@/pages/BnmLockedLive';
import BnmLockedLiveWatch from '@/pages/BnmLockedLiveWatch';
import BnmLockedOnboarding from '@/pages/BnmLockedOnboarding';

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
      <Route path="/About" element={<About />} />
      <Route path="/Contact" element={<Contact />} />
      <Route path="/AIBuddy" element={<Navigate to="/ai-coach" replace />} />
      <Route path="/Dares" element={<Navigate to="/challenge" replace />} />
      <Route path="/Truths" element={<Navigate to="/challenge" replace />} />
      <Route path="/Wallet" element={<Navigate to="/rewards" replace />} />
      <Route path="/onboarding" element={<BnmLockedOnboarding />} />
      <Route path="/" element={<Splash />} />
      <Route path="/home" element={<BnmLockedHome />} />
      <Route path="/discover" element={<BnmDiscover />} />
      <Route path="/create" element={<BnmLockedCreate />} />
      <Route path="/upload" element={<BnmLockedUpload />} />
      <Route path="/watch" element={<BnmLockedWatch />} />
      <Route path="/live" element={<BnmLockedLive />} />
      <Route path="/live-watch" element={<BnmLockedLiveWatch />} />
      <Route path="/tracker" element={<BnmTracker />} />
      <Route path="/camera" element={<BnmLockedCreate />} />
      <Route path="/effects" element={<BnmEffects />} />
      <Route path="/nearby" element={<BnmLockedNearby />} />
      <Route path="/challenge" element={<BnmLockedChallenge />} />
      <Route path="/challenge/:challengeId" element={<BnmLockedChallenge />} />
      <Route path="/search" element={<BnmLockedSearch />} />
      <Route path="/profile" element={<BnmLockedProfile />} />
      <Route path="/create-channel" element={<BnmLockedCreateChannel />} />
      <Route path="/settings" element={<BnmLockedSettings />} />
      <Route path="/creator-studio" element={<BnmLockedCreatorStudio />} />
      <Route path="/ai-coach" element={<BnmLockedAiCoach />} />
      <Route path="/rewards" element={<BnmLockedRewards />} />
      <Route path="/reward-checkout" element={<BnmLockedCheckout />} />
      <Route path="/reward-checkout/:rewardId" element={<BnmLockedCheckout />} />
      <Route path="/inbox" element={<BnmInbox />} />
      <Route path="/messages" element={<BnmMessages />} />
      <Route path="/menu" element={<BnmMenu />} />
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