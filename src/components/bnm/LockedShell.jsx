import { Link, NavLink, useLocation } from "react-router-dom";
import {
  BnmBellIcon, BnmCreateIcon, BnmExploreIcon,
  BnmHomeIcon, BnmInboxIcon, BnmLocationIcon, BnmProfileIcon
} from "@/components/bnm/BnmIcons";

const cx = (...v) => v.filter(Boolean).join(" ");

export function BnmWordmark({ compact = false }) {
  return (
    <Link to="/home" className="flex items-center gap-1 font-black tracking-[-0.055em] text-white" aria-label="Be Near Me home">
      <span className={compact ? "text-[20px]" : "text-[24px]"}>Be Near</span>
      <span className={cx("bg-gradient-to-r from-[#22c9ff] via-[#8b5cff] to-[#ff39b7] bg-clip-text text-transparent", compact ? "text-[20px]" : "text-[24px]")}>Me</span>
      <BnmLocationIcon size={compact ? 18 : 20} />
    </Link>
  );
}

const tabs = [
  { label: "For You", to: "/home", match: ["/home"] },
  { label: "Nearby", to: "/nearby", match: ["/nearby", "/search"] },
  { label: "Kindness", to: "/challenge", match: ["/challenge"] },
  { label: "Creators", to: "/creator-studio", match: ["/creator-studio", "/profile"] },
  { label: "Live", to: "/Live", match: ["/Live", "/live"] },
];

export function BnmTopChrome({ rewards = false, locationLabel = "Near You", activeSection = null }) {
  const { pathname } = useLocation();
  const allTabs = rewards ? [...tabs, { label: "Rewards", to: "/rewards", match: ["/rewards", "/reward-checkout"] }] : tabs;
  return (
    <header className="relative z-40 w-full overflow-hidden bg-[#031126]/95 px-3 pb-1 pt-[max(env(safe-area-inset-top),10px)] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[430px] min-w-0 items-center gap-2">
        <BnmWordmark />
        <div className="ml-auto flex min-w-0 items-center gap-1.5">
          <button type="button" className="flex h-9 min-w-0 max-w-[108px] items-center gap-1.5 rounded-full border border-[#6d70ff]/60 bg-[#17234a] px-2.5 text-[10px] font-bold text-white">
            <BnmLocationIcon size={16} />
            <span className="truncate">{locationLabel}</span>
            <span className="text-[#92a4ce]">⌄</span>
          </button>
          <Link to="/inbox" className="relative grid h-8 w-8 shrink-0 place-items-center text-white/90" aria-label="Notifications">
            <BnmBellIcon size={20} />
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-[#ff38ad] ring-2 ring-[#031126]" />
          </Link>
        </div>
      </div>
      <nav className={cx("mx-auto mt-2.5 grid w-full max-w-[430px] items-end gap-0", rewards ? "grid-cols-6" : "grid-cols-5")} aria-label="Be Near Me sections">
        {allTabs.map((tab) => {
          const active = activeSection ? tab.label === activeSection : tab.match.some((p) => pathname === p || pathname.startsWith(p + "/"));
          return (
            <Link key={tab.label} to={tab.to} className={cx("min-w-0 relative pb-2.5 text-center font-semibold transition", rewards ? "text-[9px]" : "text-[10px]", active ? "text-white" : "text-[#8797c6]")}>
              {tab.label}
              {active && <span className="absolute inset-x-[20%] bottom-1 h-[3px] rounded-full bg-gradient-to-r from-[#ff43c2] via-[#ad4dff] to-[#24c7ff] shadow-[0_0_12px_rgba(83,117,255,.75)]" />}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

const bottom = [
  { to: "/home", label: "Home", Icon: BnmHomeIcon },
  { to: "/search", label: "Explore", Icon: BnmExploreIcon },
  { to: "/create", label: "Create", Icon: BnmCreateIcon, create: true },
  { to: "/inbox", label: "Inbox", Icon: BnmInboxIcon, badge: true },
  { to: "/profile", label: "Profile", Icon: BnmProfileIcon },
];

export function BnmBottomChrome() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 w-full overflow-hidden border-t border-[#20365b] bg-[#020c1c]/95 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur-2xl" aria-label="Primary navigation">
      <div className="mx-auto flex h-[68px] w-full max-w-[430px] min-w-0 items-center px-1">
        {bottom.map(({ to, label, Icon, create, badge }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cx("group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[9px] font-semibold", isActive ? "text-white" : "text-[#8494bd]")}>
            {({ isActive }) => (
              <>
                {create ? (
                  <span className="grid h-10 w-14 place-items-center">
                    <Icon size={30} />
                  </span>
                ) : (
                  <span className="relative grid h-8 w-9 place-items-center">
                    <Icon active={isActive} size={26} />
                    {badge && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-[#ff3fae] ring-2 ring-[#020c1c]" />}
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

export function BnmLockedScreen({ children, rewards = false, locationLabel = "Near You", activeSection = null, className = "" }) {
  return (
    <div className={cx("min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#020b19] text-white", className)}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(31,93,255,.16),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(188,54,255,.12),transparent_35%)]" />
      <BnmTopChrome rewards={rewards} locationLabel={locationLabel} activeSection={activeSection} />
      <main className="relative z-10 mx-auto w-full max-w-[430px] min-w-0 overflow-x-hidden pb-[92px]">{children}</main>
      <BnmBottomChrome />
    </div>
  );
}

export function Glass({ children, className = "" }) {
  return <div className={cx("rounded-[20px] border border-[#263e68] bg-[#08162b]/92 shadow-[0_18px_45px_rgba(0,0,0,.22)] backdrop-blur-xl", className)}>{children}</div>;
}

export function Pill({ children, active = false, className = "" }) {
  return (
    <span className={cx(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold",
      active ? "border-[#39b9ff] bg-gradient-to-r from-[#2e8fff] to-[#d53dff] text-white shadow-[0_0_16px_rgba(116,72,255,.3)]" : "border-[#35517c] bg-[#0a1832] text-[#b4c2e2]",
      className
    )}>{children}</span>
  );
}

export function GradientButton({ children, className = "", ...props }) {
  return (
    <button {...props} className={cx("rounded-full bg-gradient-to-r from-[#26c8ff] via-[#8553ff] to-[#ff38aa] px-5 py-3 text-sm font-black text-white shadow-[0_0_24px_rgba(131,78,255,.32)] disabled:cursor-not-allowed disabled:opacity-50", className)}>
      {children}
    </button>
  );
}

export function SectionTitle({ title, action, href }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[22px] font-black tracking-[-0.03em] text-white">{title}</h2>
      {action ? <Link to={href || "#"} className="text-xs font-bold text-[#46bfff]">{action} ›</Link> : null}
    </div>
  );
}

export function Avatar({ src, label = "BNM", size = 44, ring = true }) {
  return (
    <div className={cx("shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#30c8ff] via-[#9650ff] to-[#ff3aa9] p-[2px]", ring && "shadow-[0_0_20px_rgba(140,75,255,.3)]")} style={{ width: size, height: size }}>
      <div className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-[#0a1730] text-xs font-black text-white">
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : label.slice(0,2).toUpperCase()}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body }) {
  return (
    <Glass className="mx-4 p-8 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#26c8ff]/20 via-[#8f54ff]/20 to-[#ff38aa]/20">
        <Icon className="h-7 w-7 text-[#9e8bff]" />
      </div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#8fa0c4]">{body}</p>
    </Glass>
  );
}

export function Metric({ icon: Icon, value, label, accent = "text-[#ff55b5]" }) {
  return (
    <div className="min-w-0 rounded-[16px] border border-[#2b426c] bg-[#0b1931] p-3">
      <Icon className={cx("h-5 w-5", accent)} />
      <div className="mt-2 truncate text-[20px] font-black">{value ?? "—"}</div>
      <div className="text-[10px] text-[#8799bd]">{label}</div>
    </div>
  );
}

export function MediaBackdrop({ src, children, className = "" }) {
  return (
    <div className={cx("relative overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#102850,#11142c_55%,#351342)]", className)}>
      {src ? <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020812] via-transparent to-[#031126]/15" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function formatCount(n) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v >= 10_000_000 ? 0 : 1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(v >= 100_000 ? 0 : 1) + "K";
  return String(v);
}

export function asItems(result) {
  if (Array.isArray(result)) return result;
  return result?.items || [];
}

export const BNM_GRADIENT = "from-[#24c7ff] via-[#8752ff] to-[#ff37aa]";