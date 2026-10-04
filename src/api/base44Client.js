import { createClient } from "@base44/sdk";
import { appParams } from "@/lib/app-params";

// Base44 remains the temporary backend compatibility layer while Be Near Me
// converges onto its native data/auth stack. External provider login is not
// allowed to become the product entry gate, so redirectToLogin is intercepted
// and routed to the in-app account boundary instead.
const rawBase44 = createClient({
  appId: appParams.appId,
  serverUrl: appParams.serverUrl,
  token: appParams.token,
  functionsVersion: appParams.functionsVersion,
  requiresAuth: false,
});

function routeToNativeAccount(returnUrl) {
  if (typeof window === "undefined") return;

  let next =
    window.location.pathname +
    window.location.search +
    window.location.hash;

  try {
    if (returnUrl) {
      const parsed = new URL(returnUrl, window.location.origin);
      if (parsed.origin === window.location.origin) {
        next = parsed.pathname + parsed.search + parsed.hash;
      }
    }
  } catch {
    // Keep the current in-app path when the supplied return URL is invalid.
  }

  const target = "/account?next=" + encodeURIComponent(next || "/home");
  if (window.location.pathname !== "/account") {
    window.location.assign(target);
  }
}

const authFacade = new Proxy(rawBase44.auth, {
  get(target, prop) {
    if (prop === "redirectToLogin") return routeToNativeAccount;
    const value = Reflect.get(target, prop, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export const base44 = new Proxy(rawBase44, {
  get(target, prop) {
    if (prop === "auth") return authFacade;
    const value = Reflect.get(target, prop, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});
