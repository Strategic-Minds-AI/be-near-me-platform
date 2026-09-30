import Home from './pages/Home';
import Watch from './pages/Watch';
import Channel from './pages/Channel';
import Upload from './pages/Upload';
import CreateChannel from './pages/CreateChannel';
import Search from './pages/Search';
import Explore from './pages/Explore';
import Trending from './pages/Trending';
import Category from './pages/Category';
import Subscriptions from './pages/Subscriptions';
import History from './pages/History';
import LikedVideos from './pages/LikedVideos';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Live from './pages/Live';
import CreatorStudio from './pages/CreatorStudio';
import StudioContent from './pages/StudioContent';
import StudioAnalytics from './pages/StudioAnalytics';
import StudioEarnings from './pages/StudioEarnings';
import Shorts from './pages/Shorts';
import Notifications from './pages/Notifications';
import Playlists from './pages/Playlists';
import LiveWatch from './pages/LiveWatch';
import StudioLive from './pages/StudioLive';
import StudioComments from './pages/StudioComments';
import Community from './pages/Community';
import StudioAIClips from './pages/StudioAIClips';
import Premium from './pages/Premium';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Watch": Watch,
    "Channel": Channel,
    "Upload": Upload,
    "CreateChannel": CreateChannel,
    "Search": Search,
    "Explore": Explore,
    "Trending": Trending,
    "Category": Category,
    "Subscriptions": Subscriptions,
    "History": History,
    "LikedVideos": LikedVideos,
    "Settings": Settings,
    "Admin": Admin,
    "Live": Live,
    "CreatorStudio": CreatorStudio,
    "StudioContent": StudioContent,
    "StudioAnalytics": StudioAnalytics,
    "StudioEarnings": StudioEarnings,
    "Shorts": Shorts,
    "Notifications": Notifications,
    "Playlists": Playlists,
    "LiveWatch": LiveWatch,
    "StudioLive": StudioLive,
    "StudioComments": StudioComments,
    "Community": Community,
    "StudioAIClips": StudioAIClips,
    "Premium": Premium,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};