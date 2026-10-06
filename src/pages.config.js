import Splash from './pages/Splash';
import About from './pages/About';
import Contact from './pages/Contact';
import BnmDiscover from './pages/BnmDiscover';
import BnmEffects from './pages/BnmEffects';
import BnmInbox from './pages/BnmInbox';
import BnmMessages from './pages/BnmMessages';
import BnmMenu from './pages/BnmMenu';
import BnmTracker from './pages/BnmTracker';
import BnmLockedHome from './pages/BnmLockedHome';
import BnmLockedNearby from './pages/BnmLockedNearby';
import BnmLockedChallenge from './pages/BnmLockedChallenge';
import BnmLockedSearch from './pages/BnmLockedSearch';
import BnmLockedProfile from './pages/BnmLockedProfile';
import BnmLockedCreateChannel from './pages/BnmLockedCreateChannel';
import BnmLockedSettings from './pages/BnmLockedSettings';
import BnmLockedCreatorStudio from './pages/BnmLockedCreatorStudio';
import BnmLockedAiCoach from './pages/BnmLockedAiCoach';
import BnmLockedRewards from './pages/BnmLockedRewards';
import BnmLockedCheckout from './pages/BnmLockedCheckout';
import BnmLockedCreate from './pages/BnmLockedCreate';
import BnmLockedUpload from './pages/BnmLockedUpload';
import BnmLockedWatch from './pages/BnmLockedWatch';
import BnmLockedLive from './pages/BnmLockedLive';
import BnmLockedLiveWatch from './pages/BnmLockedLiveWatch';
import BnmLockedOnboarding from './pages/BnmLockedOnboarding';
import __Layout from './Layout.jsx';

export const PAGES = {
  Splash,
  About,
  Contact,
  home: BnmLockedHome,
  discover: BnmDiscover,
  create: BnmLockedCreate,
  upload: BnmLockedUpload,
  watch: BnmLockedWatch,
  live: BnmLockedLive,
  'live-watch': BnmLockedLiveWatch,
  tracker: BnmTracker,
  effects: BnmEffects,
  nearby: BnmLockedNearby,
  challenge: BnmLockedChallenge,
  search: BnmLockedSearch,
  profile: BnmLockedProfile,
  'create-channel': BnmLockedCreateChannel,
  settings: BnmLockedSettings,
  'creator-studio': BnmLockedCreatorStudio,
  'ai-coach': BnmLockedAiCoach,
  rewards: BnmLockedRewards,
  'reward-checkout': BnmLockedCheckout,
  inbox: BnmInbox,
  messages: BnmMessages,
  menu: BnmMenu,
  onboarding: BnmLockedOnboarding,
};

export const pagesConfig = {
  mainPage: 'Splash',
  Pages: PAGES,
  Layout: __Layout,
};
