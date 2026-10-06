import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { bnmData } from '@/services/bnmData';

export default function NavigationTracker() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    window.parent?.postMessage({
      type: "app_changed_url",
      url: window.location.href
    }, '*');
  }, [location]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const segment = location.pathname.replace(/^\//, '').split('/')[0];
    const pageName = segment || 'home';
    bnmData.appLogs.logUserInApp(pageName).catch(() => {
      // Analytics must never break navigation.
    });
  }, [location, isAuthenticated]);

  return null;
}
