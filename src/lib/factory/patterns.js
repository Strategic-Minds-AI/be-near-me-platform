// Universal Frontend Factory — Pattern Registry (Lean)
// Consolidated from UNIVERSAL_FRONTEND_FACTORY_BASE44_v2
// Provides the factory's pattern registry and quality standards for Be Near Me.

export const REGISTRY_VERSION = "2.0.0";

// ── Active configuration for Be Near Me ──
// Be Near Me maps to: Domain Pack DP07 (Creator/Media) + Recipe R02 (Short Video/Reels)
// + Mobile Pattern M02 (Full-Screen Swipe Feed) + Navigation N01 (Bottom tab bar)
export const APP_PROFILE = {
  domainPack: "DP07",
  experienceRecipe: "R02",
  mobilePattern: "M02",
  navigation: "N01",
  colorSystem: "C02", // Midnight Electric — matches dark premium aesthetic
  typography: "T15",  // Creator Expressive
  surfaceSystem: "SF04", // Glass overlay (for feed chrome)
  elevationSystem: "EV07", // Dark ambient
  densityMode: "DN02", // Comfortable
  iconSystem: "IC02", // Rounded outline
};

// ── Color Systems (20) ──
export const colorSystems = [
  { id: "C01", name: "Neutral SaaS Blue", primary: "#2563EB", secondary: "#60A5FA", accent: "#0F172A", background: "#F8FAFC", surface: "#FFFFFF", text: "#0F172A", muted_text: "#64748B" },
  { id: "C02", name: "Midnight Electric", primary: "#2563EB", secondary: "#7C3AED", accent: "#38BDF8", background: "#050816", surface: "#0B1220", text: "#F8FAFC", muted_text: "#94A3B8" },
  { id: "C03", name: "Graphite Lime", primary: "#A3E635", secondary: "#65A30D", accent: "#18181B", background: "#F7F7F5", surface: "#FFFFFF", text: "#18181B", muted_text: "#71717A" },
  { id: "C04", name: "Black Gold Luxury", primary: "#D4AF37", secondary: "#F3D36B", accent: "#111111", background: "#F7F5EF", surface: "#FFFFFF", text: "#111111", muted_text: "#6B665A" },
  { id: "C05", name: "Warm Editorial", primary: "#B45309", secondary: "#F59E0B", accent: "#3F2D20", background: "#FFF9F1", surface: "#FFFFFF", text: "#2B211A", muted_text: "#7C6A5B" },
  { id: "C06", name: "Indigo Violet", primary: "#4F46E5", secondary: "#8B5CF6", accent: "#1E1B4B", background: "#F7F7FF", surface: "#FFFFFF", text: "#17153B", muted_text: "#6B6A86" },
  { id: "C07", name: "Ocean Teal", primary: "#0F766E", secondary: "#2DD4BF", accent: "#083344", background: "#F0FDFA", surface: "#FFFFFF", text: "#134E4A", muted_text: "#5F7D7A" },
  { id: "C08", name: "Emerald Finance", primary: "#059669", secondary: "#34D399", accent: "#064E3B", background: "#F0FDF4", surface: "#FFFFFF", text: "#064E3B", muted_text: "#5F766A" },
  { id: "C09", name: "Coral Commerce", primary: "#F97316", secondary: "#FB7185", accent: "#431407", background: "#FFF7ED", surface: "#FFFFFF", text: "#3B1B14", muted_text: "#7C6157" },
  { id: "C10", name: "Rose Creator", primary: "#E11D48", secondary: "#F472B6", accent: "#4C0519", background: "#FFF1F2", surface: "#FFFFFF", text: "#3F0A18", muted_text: "#80606A" },
  { id: "C11", name: "Amber Utility", primary: "#D97706", secondary: "#FBBF24", accent: "#422006", background: "#FFFBEB", surface: "#FFFFFF", text: "#3A2508", muted_text: "#806D4E" },
  { id: "C12", name: "Slate Cyan", primary: "#0891B2", secondary: "#22D3EE", accent: "#164E63", background: "#F0F9FF", surface: "#FFFFFF", text: "#153E4A", muted_text: "#607883" },
  { id: "C13", name: "Soft Lavender", primary: "#7C3AED", secondary: "#C4B5FD", accent: "#3B1F64", background: "#FAF7FF", surface: "#FFFFFF", text: "#2E1A47", muted_text: "#756784" },
  { id: "C14", name: "Earth Sand", primary: "#78716C", secondary: "#A8A29E", accent: "#44403C", background: "#FAF7F2", surface: "#FFFFFF", text: "#292524", muted_text: "#78716C" },
  { id: "C15", name: "Monochrome High Contrast", primary: "#111111", secondary: "#525252", accent: "#000000", background: "#FFFFFF", surface: "#F5F5F5", text: "#000000", muted_text: "#525252" },
  { id: "C16", name: "Frost Glass", primary: "#0EA5E9", secondary: "#8B5CF6", accent: "#172554", background: "#F8FBFF", surface: "#FFFFFFCC", text: "#0C1E3F", muted_text: "#5B7299" },
  { id: "C17", name: "Sunset Gradient", primary: "#F43F5E", secondary: "#FBBF24", accent: "#831843", background: "#FFF0F5", surface: "#FFFFFF", text: "#831843", muted_text: "#9F6B7A" },
  { id: "C18", name: "Forest Pine", primary: "#16A34A", secondary: "#84CC16", accent: "#14532D", background: "#F0FDF0", surface: "#FFFFFF", text: "#14532D", muted_text: "#5C7A5C" },
  { id: "C19", name: "Royal Purple", primary: "#7C3AED", secondary: "#A78BFA", accent: "#3B0764", background: "#FAF5FF", surface: "#FFFFFF", text: "#3B0764", muted_text: "#7B6F8A" },
  { id: "C20", name: "Neon Night", primary: "#EC4899", secondary: "#06B6D4", accent: "#0A0A0A", background: "#0A0A0A", surface: "#161616", text: "#FAFAFA", muted_text: "#A1A1AA" },
];

// ── Mobile Patterns (20) ──
export const mobilePatterns = [
  { id: "M01", name: "Bottom-Tab Feed", archetype: "feed", best_for: ["social","content","community"], layout_rule: "persistent 4-5 item bottom tab bar; vertically scrolling primary feed", navigation_rule: "bottom tabs", states_required: ["default","loading","empty","error","offline/slow","permission"] },
  { id: "M02", name: "Full-Screen Swipe Feed", archetype: "immersive", best_for: ["short video","stories","media"], layout_rule: "edge-to-edge content; one item per viewport; action rail", navigation_rule: "vertical swipe + overlay actions", states_required: ["default","loading","empty","error","offline/slow","permission"] },
  { id: "M03", name: "Dashboard Tiles", archetype: "dashboard", best_for: ["business","operations","utilities"], layout_rule: "summary header plus 2-column metric/action tile grid", navigation_rule: "bottom tabs or compact top bar", states_required: ["default","loading","empty","error","offline/slow","permission"] },
  { id: "M04", name: "Search-First Discovery", archetype: "discovery", best_for: ["marketplaces","directories","local search"], layout_rule: "search field dominates first viewport; filters and result cards follow", navigation_rule: "search-first + bottom tabs", states_required: ["default","loading","empty","error","offline/slow","permission"] },
  { id: "M05", name: "Map-First Local", archetype: "local", best_for: ["local discovery","maps","travel"], layout_rule: "full-bleed map with bottom sheet results", navigation_rule: "map gestures + sheet", states_required: ["default","loading","empty","error","offline/slow","permission"] },
  { id: "M06", name: "Card Stack / Stories", archetype: "stories", best_for: ["social","ephemeral","media"], layout_rule: "horizontal card stack with tap-to-advance", navigation_rule: "tap zones + swipe", states_required: ["default","loading","empty","error","offline/slow","permission"] },
  { id: "M07", name: "List + Detail", archetype: "master-detail", best_for: ["directories","CRMs","inbox"], layout_rule: "scrollable list with push/detail navigation", navigation_rule: "stack navigation", states_required: ["default","loading","empty","error","offline/slow","permission"] },
  { id: "M08", name: "Tabbed Sections", archetype: "sections", best_for: ["profiles","settings","dashboards"], layout_rule: "segmented control with section content", navigation_rule: "top tabs", states_required: ["default","loading","empty","error","offline/slow","permission"] },
  { id: "M09", name: "Onboarding Flow", archetype: "onboarding", best_for: ["first-run","signup","permissions"], layout_rule: "sequential full-screen steps with progress", navigation_rule: "step navigation", states_required: ["default","loading","error","permission"] },
  { id: "M10", name: "Composer / Upload", archetype: "create", best_for: ["content creation","posting"], layout_rule: "preview + controls + publish action", navigation_rule: "modal/sheet", states_required: ["default","loading","error","permission","success"] },
  { id: "M11", name: "Profile / Channel", archetype: "profile", best_for: ["user pages","channels"], layout_rule: "header + tabbed content grid", navigation_rule: "scroll + tabs", states_required: ["default","loading","empty","error","offline/slow"] },
  { id: "M12", name: "Settings List", archetype: "settings", best_for: ["preferences","config"], layout_rule: "grouped list rows with controls", navigation_rule: "stack navigation", states_required: ["default","loading","error"] },
  { id: "M13", name: "Media Viewer", archetype: "viewer", best_for: ["photo/video viewing"], layout_rule: "full-bleed media with overlay controls", navigation_rule: "swipe + tap zones", states_required: ["default","loading","error","offline/slow"] },
  { id: "M14", name: "Chat Thread", archetype: "messaging", best_for: ["DMs","comments","support"], layout_rule: "message bubbles + composer", navigation_rule: "stack + scroll", states_required: ["default","loading","empty","error","offline/slow"] },
  { id: "M15", name: "Notification Center", archetype: "inbox", best_for: ["alerts","activity"], layout_rule: "grouped notification list with actions", navigation_rule: "stack navigation", states_required: ["default","loading","empty","error"] },
  { id: "M16", name: "Search Results", archetype: "search", best_for: ["discovery","filtering"], layout_rule: "query bar + filter chips + result list", navigation_rule: "search-first", states_required: ["default","loading","empty","no-results","error"] },
  { id: "M17", name: "Checkout Flow", archetype: "transaction", best_for: ["commerce","payments"], layout_rule: "step-based form with summary", navigation_rule: "step navigation", states_required: ["default","loading","error","success"] },
  { id: "M18", name: "Comparison Table", archetype: "compare", best_for: ["pricing","specs"], layout_rule: "scrollable comparison columns", navigation_rule: "scroll + tap", states_required: ["default","loading","error"] },
  { id: "M19", name: "Activity Timeline", archetype: "timeline", best_for: ["history","activity","audit"], layout_rule: "chronological event list", navigation_rule: "scroll", states_required: ["default","loading","empty","error"] },
  { id: "M20", name: "Empty Canvas + FAB", archetype: "create-blank", best_for: ["note-taking","drawing","compose"], layout_rule: "blank canvas with floating action", navigation_rule: "FAB + overlay tools", states_required: ["default","loading","error"] },
];

// ── Navigation Patterns (20) ──
export const navigationPatterns = [
  { id: "N01", name: "Bottom tab bar" }, { id: "N02", name: "Top tab/segmented control" },
  { id: "N03", name: "Navigation rail" }, { id: "N04", name: "Collapsible sidebar" },
  { id: "N05", name: "Permanent sidebar" }, { id: "N06", name: "Hamburger drawer" },
  { id: "N07", name: "Mega menu" }, { id: "N08", name: "Breadcrumb hierarchy" },
  { id: "N09", name: "Command palette" }, { id: "N10", name: "Search-first navigation" },
  { id: "N11", name: "Floating action navigation" }, { id: "N12", name: "Context toolbar" },
  { id: "N13", name: "Step navigation" }, { id: "N14", name: "Pagination" },
  { id: "N15", name: "Infinite scroll with anchors" }, { id: "N16", name: "Tree navigation" },
  { id: "N17", name: "Dock / launcher" }, { id: "N18", name: "Split-view navigation" },
  { id: "N19", name: "Sticky section index" }, { id: "N20", name: "Swipe/page navigation" },
];

// ── Typography Patterns (16) ──
export const typographyPatterns = [
  { id: "T01", name: "Neo-grotesk SaaS", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T02", name: "Geometric Sans", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T03", name: "Humanist Sans", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T04", name: "Editorial Serif + Sans", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T05", name: "Luxury High-Contrast Serif", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T06", name: "Condensed Utility", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T07", name: "Rounded Friendly Sans", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T08", name: "Technical Mono Accent", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T09", name: "Display Sans + Neutral Body", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T10", name: "System Native", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T11", name: "Variable Sans", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T12", name: "Soft Serif", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T13", name: "Brutalist Grotesk", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T14", name: "Financial Conservative", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T15", name: "Creator Expressive", rule: "Disciplined type scale; body legibility outranks display novelty." },
  { id: "T16", name: "Enterprise Dense", rule: "Disciplined type scale; body legibility outranks display novelty." },
];

// ── Motion Patterns (20) ──
export const motionPatterns = [
  { id: "MO01", name: "Fade/translate reveal", reduced_motion_required: true },
  { id: "MO02", name: "Shared-element transition", reduced_motion_required: true },
  { id: "MO03", name: "Sheet slide", reduced_motion_required: true },
  { id: "MO04", name: "Drawer slide", reduced_motion_required: true },
  { id: "MO05", name: "Accordion expand", reduced_motion_required: true },
  { id: "MO06", name: "Tab indicator", reduced_motion_required: true },
  { id: "MO07", name: "Card hover lift", reduced_motion_required: true },
  { id: "MO08", name: "Button press feedback", reduced_motion_required: true },
  { id: "MO09", name: "Skeleton shimmer", reduced_motion_required: true },
  { id: "MO10", name: "Progress morph", reduced_motion_required: true },
  { id: "MO11", name: "Success confirmation", reduced_motion_required: true },
  { id: "MO12", name: "Error shake/subtle attention", reduced_motion_required: true },
  { id: "MO13", name: "Drag/reorder", reduced_motion_required: true },
  { id: "MO14", name: "Swipe-dismiss", reduced_motion_required: true },
  { id: "MO15", name: "Parallax restrained", reduced_motion_required: true },
  { id: "MO16", name: "Scroll-linked section reveal", reduced_motion_required: true },
  { id: "MO17", name: "Page transition", reduced_motion_required: true },
  { id: "MO18", name: "Toast/banner slide", reduced_motion_required: true },
  { id: "MO19", name: "Count-up animation", reduced_motion_required: true },
  { id: "MO20", name: "Media load-in", reduced_motion_required: true },
];

// ── State Patterns (16) ──
export const statePatterns = [
  { id: "S01", name: "Initial/first-run" }, { id: "S02", name: "Loading spinner" },
  { id: "S03", name: "Skeleton loading" }, { id: "S04", name: "Empty state" },
  { id: "S05", name: "No results" }, { id: "S06", name: "Error recoverable" },
  { id: "S07", name: "Error blocking" }, { id: "S08", name: "Offline" },
  { id: "S09", name: "Slow network" }, { id: "S10", name: "Permission request" },
  { id: "S11", name: "Success/confirmation" }, { id: "S12", name: "Maintenance/read-only" },
  { id: "S13", name: "Locked/paywall" }, { id: "S14", name: "Archived/deleted" },
  { id: "S15", name: "Partial data" }, { id: "S16", name: "Permission denied" },
];

// ── Experience Recipes (key ones for Be Near Me) ──
export const experienceRecipes = [
  { id: "R01", name: "Mobile Social Feed", domain: "social/community", canonical_flow: "feed > detail > create > comments > profile" },
  { id: "R02", name: "Short Video / Reels", domain: "creator/media", canonical_flow: "immersive feed > comments sheet > creator > create/upload" },
  { id: "R03", name: "Local Discovery", domain: "directory/local", canonical_flow: "location/search > results/map > business detail > contact/book > saved" },
  { id: "R04", name: "Marketplace", domain: "marketplace", canonical_flow: "search/browse > filters > item detail > seller > save/share > transaction" },
  { id: "R05", name: "Ecommerce Store", domain: "commerce", canonical_flow: "home > category > PDP > cart > checkout > confirmation > account" },
  { id: "R06", name: "SaaS Workspace", domain: "saas", canonical_flow: "home dashboard > object list > object detail > create/edit > settings" },
  { id: "R07", name: "CRM", domain: "crm", canonical_flow: "pipeline > contact/company > activity > task > reporting > settings" },
  { id: "R08", name: "Analytics Dashboard", domain: "analytics", canonical_flow: "overview > drilldown > filter > comparison > export/share" },
  { id: "R09", name: "AI Chat + Artifacts", domain: "ai", canonical_flow: "thread list > conversation > tool/artifact panel > approvals > history" },
  { id: "R10", name: "AI Agent Control Plane", domain: "ai/ops", canonical_flow: "overview > agent registry > queue > task detail > receipts > approvals" },
];

// ── Domain Packs ──
export const domainPacks = [
  { id: "DP01", name: "SaaS" }, { id: "DP02", name: "AI / Agent Platform" },
  { id: "DP03", name: "Local Service" }, { id: "DP04", name: "Ecommerce" },
  { id: "DP05", name: "Marketplace" }, { id: "DP06", name: "Social / Community" },
  { id: "DP07", name: "Creator / Media" }, { id: "DP08", name: "Analytics" },
  { id: "DP09", name: "Portal" }, { id: "DP10", name: "Directory" },
  { id: "DP11", name: "Marketing Site" }, { id: "DP12", name: "Education" },
  { id: "DP13", name: "Healthcare" }, { id: "DP14", name: "Finance" },
  { id: "DP15", name: "Real Estate" }, { id: "DP16", name: "Travel" },
  { id: "DP17", name: "Food & Restaurant" }, { id: "DP18", name: "Events" },
  { id: "DP19", name: "Government" }, { id: "DP20", name: "Nonprofit" },
];

// ── Semantic Color Roles (38) ──
export const semanticColorRoles = [
  { id: "SCR01", role: "background/canvas", purpose: "Primary app/page canvas" },
  { id: "SCR02", role: "background/subtle", purpose: "Low-emphasis background" },
  { id: "SCR03", role: "surface/base", purpose: "Default component surface" },
  { id: "SCR04", role: "surface/raised", purpose: "Elevated surface" },
  { id: "SCR05", role: "surface/sunken", purpose: "Inset/recessed surface" },
  { id: "SCR06", role: "surface/overlay", purpose: "Menus/dialogs/popovers" },
  { id: "SCR07", role: "text/primary", purpose: "Primary text" },
  { id: "SCR08", role: "text/secondary", purpose: "Secondary text" },
  { id: "SCR09", role: "text/tertiary", purpose: "Muted/supporting text" },
  { id: "SCR10", role: "text/inverse", purpose: "Text on inverse surfaces" },
  { id: "SCR11", role: "border/subtle", purpose: "Low-emphasis divider" },
  { id: "SCR12", role: "border/default", purpose: "Standard divider" },
  { id: "SCR13", role: "border/strong", purpose: "High-emphasis boundary" },
  { id: "SCR14", role: "border/focus", purpose: "Focus ring" },
  { id: "SCR15", role: "action/primary", purpose: "Primary action fill" },
  { id: "SCR16", role: "action/primary-foreground", purpose: "Text on primary action" },
  { id: "SCR17", role: "action/secondary", purpose: "Secondary action fill" },
  { id: "SCR18", role: "action/secondary-foreground", purpose: "Text on secondary action" },
  { id: "SCR19", role: "action/ghost", purpose: "Transparent action" },
  { id: "SCR20", role: "action/disabled", purpose: "Disabled action fill" },
  { id: "SCR21", role: "action/disabled-foreground", purpose: "Text on disabled action" },
  { id: "SCR22", role: "status/success", purpose: "Success state" },
  { id: "SCR23", role: "status/warning", purpose: "Warning state" },
  { id: "SCR24", role: "status/danger", purpose: "Error/danger state" },
  { id: "SCR25", role: "status/info", purpose: "Informational state" },
  { id: "SCR26", role: "status/success-foreground", purpose: "Text on success" },
  { id: "SCR27", role: "status/warning-foreground", purpose: "Text on warning" },
  { id: "SCR28", role: "status/danger-foreground", purpose: "Text on danger" },
  { id: "SCR29", role: "status/info-foreground", purpose: "Text on info" },
  { id: "SCR30", role: "media/overlay", purpose: "Overlay on media" },
  { id: "SCR31", role: "media/scrim", purpose: "Scrim over media for text legibility" },
  { id: "SCR32", role: "media/progress", purpose: "Playback progress" },
  { id: "SCR33", role: "navigation/active", purpose: "Active nav indicator" },
  { id: "SCR34", role: "navigation/inactive", purpose: "Inactive nav item" },
  { id: "SCR35", role: "selection/highlight", purpose: "Selected item background" },
  { id: "SCR36", role: "selection/highlight-foreground", purpose: "Text on selection" },
  { id: "SCR37", role: "chart/primary", purpose: "Primary chart color" },
  { id: "SCR38", role: "chart/secondary", purpose: "Secondary chart color" },
];

// ── Elevation Systems (10) ──
export const elevationSystems = [
  { id: "EV01", name: "None", best_for: "flat interfaces" },
  { id: "EV02", name: "Hairline", best_for: "border-led separation" },
  { id: "EV03", name: "Low", best_for: "hover/selected cards" },
  { id: "EV04", name: "Medium", best_for: "menus/popovers" },
  { id: "EV05", name: "High", best_for: "dialogs/drawers" },
  { id: "EV06", name: "Ambient", best_for: "premium large surfaces" },
  { id: "EV07", name: "Dark Ambient", best_for: "dark theme elevation via tone + shadow" },
  { id: "EV08", name: "Inset", best_for: "input/well/sunken regions" },
  { id: "EV09", name: "Floating Action", best_for: "FAB / primary floating controls" },
  { id: "EV10", name: "Media Overlay", best_for: "overlay chrome over imagery" },
];

// ── Theme Modes (5) ──
export const themeModes = [
  { id: "TM01", name: "Light", required: true, rules: ["light canvas","dark readable foreground","semantic role mapping"] },
  { id: "TM02", name: "Dark", required: true, rules: ["dark canvas","light readable foreground","avoid naive color inversion"] },
  { id: "TM03", name: "High Contrast Light", required: true, rules: ["stronger boundaries","enhanced focus","minimum ambiguity"] },
  { id: "TM04", name: "High Contrast Dark", required: true, rules: ["stronger boundaries","enhanced focus","minimum ambiguity"] },
  { id: "TM05", name: "Brand Campaign", required: false, rules: ["limited scope only","must preserve semantic contrast","never replace system status meanings"] },
];

// ── Density Modes (5) ──
export const densityModes = [
  { id: "DN01", name: "Airy", base_control_height: 48, base_gap: 16, use_for: ["luxury","marketing","consumer onboarding"] },
  { id: "DN02", name: "Comfortable", base_control_height: 44, base_gap: 12, use_for: ["consumer apps","social","content"] },
  { id: "DN03", name: "Compact", base_control_height: 36, base_gap: 8, use_for: ["power-user","data-heavy","enterprise"] },
  { id: "DN04", name: "Dense", base_control_height: 32, base_gap: 4, use_for: ["trading","admin","expert tools"] },
  { id: "DN05", name: "Immersive", base_control_height: 40, base_gap: 0, use_for: ["media viewers","full-screen experiences"] },
];

// ── Surface Systems (12) ──
export const surfaceSystems = [
  { id: "SF01", name: "Flat Editorial", rule: "minimal borders; no routine shadows" },
  { id: "SF02", name: "Bordered Utility", rule: "1px semantic boundaries; flat surfaces" },
  { id: "SF03", name: "Layered Cards", rule: "elevation tiers separate content zones" },
  { id: "SF04", name: "Glass Overlay", rule: "translucent surfaces over media; use sparingly" },
  { id: "SF05", name: "Material Tonal", rule: "tone-based elevation in dark themes" },
  { id: "SF06", name: "Neumorphic Soft", rule: "soft shadows for tactile surfaces" },
  { id: "SF07", name: "High-Contrast Line", rule: "strong borders; minimal fill" },
  { id: "SF08", name: "Minimal Mono", rule: "monochrome surfaces with type-led hierarchy" },
  { id: "SF09", name: "Gradient Accent", rule: "subtle gradient surfaces for focal zones" },
  { id: "SF10", name: "Textured", rule: "material-inspired texture on large surfaces" },
  { id: "SF11", name: "Frosted Panel", rule: "blur + transparency for overlay panels" },
  { id: "SF12", name: "Solid Block", rule: "opaque color blocks for clear separation" },
];

// ── Icon Systems (12) ──
export const iconSystems = [
  { id: "IC01", name: "Outline Neutral", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
  { id: "IC02", name: "Rounded Outline", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
  { id: "IC03", name: "Filled Solid", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
  { id: "IC04", name: "Duotone", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
  { id: "IC05", name: "Glyph Minimal", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
  { id: "IC06", name: "Hand-drawn", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
  { id: "IC07", name: "3D Illustration", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
  { id: "IC08", name: "Isometric", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
  { id: "IC09", name: "Emoji Native", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
  { id: "IC10", name: "Brand Custom", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
  { id: "IC11", name: "Monochrome Line", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
  { id: "IC12", name: "Variable Weight", rules: ["one family per primary interface","consistent stroke/optical weight","semantic label when ambiguous"] },
];

// ── Aesthetic Guardrails (from 12_AESTHETIC_GUARDRAILS.md) ──
export const aestheticGuardrails = [
  "every region placed inside a rounded card",
  "every label placed in a pill",
  "random purple/blue gradients without brand purpose",
  "glassmorphism across the entire interface",
  "giant generic hero copy with weak product explanation",
  "repeated three-column icon grids used as filler",
  "excessive shadows instead of hierarchy",
  "inconsistent corner radii",
  "too many font sizes/weights",
  "centered text for dense utility content",
  "animation on every element",
  "meaningless dashboard charts",
  "fake metrics/testimonials as visual filler",
  "decorative icons replacing clear labels",
  "desktop layout merely scaled down to mobile",
  "mobile layout merely stretched to desktop",
];

// ── Consistency Linter Rules (from 10_AUTOMATION_AND_CONSISTENCY_LINTER.md) ──
export const consistencyLinterRules = [
  "raw colors outside primitive tokens",
  "arbitrary spacing, radius, shadow, font size, or z-index proliferation",
  "mixed icon families",
  "inconsistent card anatomy",
  "unstable navigation labels/order",
  "decorative gradients/glass/pills without a system role",
  "excessive accent usage",
  "missing loading/empty/error/permission/success states",
  "unsupported responsive collapse",
  "inaccessible focus/contrast/target behavior",
  "fake testimonials, metrics, addresses, or other live-looking invented data",
];

// ── Utility: lookup by ID ──
export function findPattern(list, id) {
  return list.find((p) => p.id === id);
}

export function getColorSystem(id) { return findPattern(colorSystems, id); }
export function getMobilePattern(id) { return findPattern(mobilePatterns, id); }
export function getRecipe(id) { return findPattern(experienceRecipes, id); }
export function getDomainPack(id) { return findPattern(domainPacks, id); }
export function getStatePattern(id) { return findPattern(statePatterns, id); }