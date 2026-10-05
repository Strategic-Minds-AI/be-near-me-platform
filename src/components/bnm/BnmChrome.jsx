import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BnmBackIcon, BnmBellIcon, BnmHomeIcon, BnmCreateIcon,
  BnmSearchIcon, BnmProfileIcon
} from "@/components/bnm/BnmIcons";
import BnmLogoMark from "./BnmLogoMark";

const navItems = [
  { to: "/home", label: "Home", Icon: BnmHomeIcon },
  { to: "/discover", label: "Discover", Icon: BnmSearchIcon },
  { to: "/create", label: "Create", Icon: BnmCreateIcon, create: true },
  { to: "/inbox", label: "Inbox", Icon: BnmBellIcon },
  { to: "/profile", label: "Profile", Icon: BnmProfileIcon },
];

export function BnmBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#03050a]/92 backdrop-blur-2xl"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex h-[68px] max-w-md items-center justify-around px-2">
        {navItems.map(({ to, label, Icon, create }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              "group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors " +
              (isActive ? "text-white" : "text-[#7f899f] hover:text-white")
            }
          >
            {({ isActive }) => (
              <>
                {create ? (
                  <span className="relative mb-0.5 flex h-9 w-12 items-center justify-center">
                    <span className="absolute left-0 h-8 w-9 rounded-[12px] bg-cyan-400/80" />
                    <span className="absolute right-0 h-8 w-9 rounded-[12px] bg-[#ff008f]/90" />
                    <span className="relative flex h-8 w-10 items-center justify-center rounded-[11px] bg-white shadow-[0_0_24px_rgba(255,0,153,.18)]">
                      <Icon className="h-5 w-5 text-black" strokeWidth={2.8} />
                    </span>
                  </span>
                ) : (
                  <span className="relative flex h-8 items-center justify-center">
                    <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (
                      <span className="absolute -bottom-1 h-0.5 w-7 rounded-full bg-gradient-to-r from-[#ff008f] via-[#d500ff] to-[#7a38ff]" />
                    )}
                  </span>
                )}
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function BnmHeader({ title, back = false, right = null, brand = false }) {
  const navigate = useNavigate();
  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10 bg-[#03050a]/88 backdrop-blur-2xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
        <div className="flex min-w-[44px] items-center">
          {back ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/[0.08]"
              aria-label="Go back"
            >
              <BnmBackIcon size={20} />
            </button>
          ) : brand ? (
            <Link to="/home" aria-label="B Near Me home">
              <BnmLogoMark className="h-9 w-8" />
            </Link>
          ) : null}
        </div>
        <h1 className="truncate px-3 text-[20px] font-extrabold tracking-[-0.02em] text-white">{title}</h1>
        <div className="flex min-w-[44px] justify-end">{right}</div>
      </div>
    </header>
  );
}

export function BnmEmptyState({ Icon, title, description, action = null }) {
  return (
    <div className="flex min-h-[52vh] flex-col items-center justify-center px-8 text-center">
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] shadow-[0_0_40px_rgba(192,0,255,.08)]">
        {Icon ? <Icon className="h-10 w-10 text-[#7d879d]" strokeWidth={1.7} /> : null}
      </div>
      <h2 className="text-xl font-extrabold tracking-tight text-white">{title}</h2>
      {description ? <p className="mt-2 max-w-xs text-sm leading-6 text-[#8f9ab0]">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function BnmPage({ children, nav = true, className = "" }) {
  return (
    <div className={"min-h-[100dvh] bg-[#03050a] text-white " + (nav ? "pb-[84px] " : "") + className}>
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(111,32,255,.10),transparent_72%)]" />
      <div className="relative z-10">{children}</div>
      {nav ? <BnmBottomNav /> : null}
    </div>
  );
}

export function BnmSearchField({ value, onChange, placeholder = "Search" }) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-[#9ba6bb] focus-within:border-fuchsia-500/50 focus-within:bg-white/[0.075]">
      <BnmSearchIcon size={20} />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-[#788399]"
      />
    </label>
  );
}