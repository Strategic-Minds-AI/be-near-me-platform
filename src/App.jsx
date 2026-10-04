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
import BnmAccount from '@/pages/BnmAccount';
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
import Dares from '@/pages/Dares';
import Truths from '@/pages/Truths';
import PictureToVideo from '@/pages/PictureToVideo';
import AIVideoStudio from '@/pages/AIVideoStudio';
import ViralVideoCreator from '@/pages/ViralVideoCreator';
import StudioLive from '@/pages/StudioLive';
import Community from '@/pages/Community';
import Playlists from '@/pages/Playlists';
import StudioAIClips from '@/pages/StudioAIClips';
import StudioContent from '@/pages/StudioContent';
import MediaKit from '@/pages/MediaKit';
import BnmMembership from '@/pages/BnmMembership';
import BnmCryptoMembership from '@/pages/BnmCryptoMembership';

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    isAuthenticated,
  } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#020812]">
        <div className="w-8 h-8 border-4 border-slate-500 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Signed-out users are allowed into the product. Google/Base44 auth is no
  // longer an automatic application gate. Preserve the registered-user error
  // only when an authenticated session is actually rejected.
  if (
    authError?.type === 'user_not_registered' &&
    isAuthenticated
  ) {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* MCP OAuth is a machine-integration consent route, not end-user Google auth. */}
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route path="/About" element={<About />} />
      <Route path="/Contact" element={<Contact />} />
      <Route path="/account" element={<BnmAccount />} />

      <Route path="/AIBuddy" element={<Navigate to="/ai-coach" replace />} />
      <Route path="/Dares" element={<Dares />} />
      <Route path="/dares" element={<Dares />} />
      <Route path="/Truths" element={<Truths />} />
      <Route path="/truths" element={<Truths />} />
      <Route path="/Wallet" element={<Navigate to="/rewards" replace />} />

      <Route path="/PictureToVideo" element={<PictureToVideo />} />
      <Route path="/picture-to-video" element={<PictureToVideo />} />
      <Route path="/AIVideoStudio" element={<AIVideoStudio />} />
      <Route path="/ai-video-studio" element={<AIVideoStudio />} />
      <Route path="/ViralVideoCreator" element={<ViralVideoCreator />} />
      <Route path="/viral-video-creator" element={<ViralVideoCreator />} />
      <Route path="/StudioLive" element={<StudioLive />} />
      <Route path="/studio-live" element={<StudioLive />} />
      <Route path="/Community" element={<Community />} />
      <Route path="/community" element={<Community />} />
      <Route path="/Playlists" element={<Playlists />} />
      <Route path="/playlists" element={<Playlists />} />
      <Route path="/StudioAIClips" element={<StudioAIClips />} />
      <Route path="/studio-ai-clips" element={<StudioAIClips />} />
      <Route path="/StudioContent" element={<StudioContent />} />
      <Route path="/studio-content" element={<StudioContent />} />
      <Route path="/MediaKit" element={<MediaKit />} />
      <Route path="/media-kit" element={<MediaKit />} />
      <Route path="/Premium" element={<BnmMembership />} />
      <Route path="/premium" element={<BnmMembership />} />
      <Route path="/membership" element={<BnmMembership />} />
      <Route path="/crypto-membership" element={<BnmCryptoMembership />} />

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
