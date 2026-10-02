// Universal Frontend Factory — Design System Utilities
// Provides semantic token resolution, recipe validation, and quality utilities
// based on the factory's Color Intelligence Engine and Quality Compiler.

import { APP_PROFILE, semanticColorRoles, colorSystems, statePatterns, experienceRecipes, mobilePatterns, getRecipe, getDomainPack, getMobilePattern, getColorSystem } from "./patterns";

// ── Semantic Token Resolution ──
// Maps the factory's 38 semantic color roles to the app's dark premium aesthetic.
// This generates a proper semantic token system instead of raw color values.

// Be Near Me brand colors (from existing design)
const BRAND = {
  pink: "#EC4899",      // hsl(328 100% 50%)
  magenta: "#C026D3",   // hsl(294 96% 46%)
  violet: "#8B5CF6",    // hsl(266 100% 56%)
  silver: "#E2E8F0",    // metallic silver
};

// Dark theme semantic role map (factory SCR01-SCR38)
export const darkThemeRoles = {
  // Backgrounds
  "background/canvas": "#0A0A0F",
  "background/subtle": "#12121A",
  // Surfaces
  "surface/base": "#16161F",
  "surface/raised": "#1E1E2A",
  "surface/sunken": "#0E0E16",
  "surface/overlay": "#1A1A26CC",
  // Text
  "text/primary": "#FFFFFF",
  "text/secondary": "#B4B4C8",
  "text/tertiary": "#7A7A92",
  "text/inverse": "#0A0A0F",
  // Borders
  "border/subtle": "#FFFFFF14",
  "border/default": "#FFFFFF24",
  "border/strong": "#FFFFFF40",
  "border/focus": BRAND.pink,
  // Actions
  "action/primary": BRAND.pink,
  "action/primary-foreground": "#FFFFFF",
  "action/secondary": "#1E1E2A",
  "action/secondary-foreground": "#FFFFFF",
  "action/ghost": "transparent",
  "action/disabled": "#2A2A38",
  "action/disabled-foreground": "#5A5A70",
  // Status
  "status/success": "#22C55E",
  "status/warning": "#F59E0B",
  "status/danger": "#EF4444",
  "status/info": "#3B82F6",
  "status/success-foreground": "#FFFFFF",
  "status/warning-foreground": "#0A0A0F",
  "status/danger-foreground": "#FFFFFF",
  "status/info-foreground": "#FFFFFF",
  // Media
  "media/overlay": "#00000099",
  "media/scrim": "#00000066",
  "media/progress": BRAND.pink,
  // Navigation
  "navigation/active": "#FFFFFF",
  "navigation/inactive": "#7A7A92",
  // Selection
  "selection/highlight": "#EC489922",
  "selection/highlight-foreground": "#FFFFFF",
  // Chart
  "chart/primary": BRAND.pink,
  "chart/secondary": BRAND.violet,
};

// High-contrast dark variant (factory TM04)
export const highContrastDarkRoles = {
  ...darkThemeRoles,
  "background/canvas": "#000000",
  "surface/base": "#0A0A0F",
  "surface/raised": "#16161F",
  "text/primary": "#FFFFFF",
  "text/secondary": "#E2E8F0",
  "text/tertiary": "#A1A1AA",
  "border/subtle": "#FFFFFF33",
  "border/default": "#FFFFFF55",
  "border/strong": "#FFFFFF88",
  "border/focus": "#FF69B4",
  "action/primary": "#FF1493",
  "action/primary-foreground": "#FFFFFF",
  "navigation/active": "#FFFFFF",
  "navigation/inactive": "#A1A1AA",
};

// ── Token resolution utility ──
export function resolveToken(role, theme = "dark") {
  const roleMap = theme === "high-contrast-dark" ? highContrastDarkRoles : darkThemeRoles;
  return roleMap[role] || darkThemeRoles[role];
}

// ── Recipe Validation ──
// Validates that a page follows its experience recipe's canonical flow.
export function validateRecipeFlow(recipeId, screens) {
  const recipe = experienceRecipes.find((r) => r.id === recipeId);
  if (!recipe) return { valid: false, error: "Recipe not found" };

  const flowSteps = recipe.canonical_flow.split(" > ");
  const screenNames = screens.map((s) => s.name.toLowerCase());
  const missing = flowSteps.filter(
    (step) => !screenNames.some((name) => name.includes(step.toLowerCase()))
  );

  return {
    valid: missing.length === 0,
    recipe: recipe.name,
    canonical_flow: recipe.canonical_flow,
    missing_steps: missing,
  };
}

// ── State Coverage Check ──
// Checks if a component/page declares all required states per its mobile pattern.
export function checkStateCoverage(patternId, declaredStates) {
  const pattern = mobilePatterns.find((p) => p.id === patternId);
  if (!pattern) return { valid: false, error: "Pattern not found" };

  const required = pattern.states_required || [];
  const declared = declaredStates || [];
  const missing = required.filter((s) => !declared.includes(s));

  return {
    valid: missing.length === 0,
    pattern: pattern.name,
    required_states: required,
    declared_states: declared,
    missing_states: missing,
  };
}

// ── Color Ratio Discipline (from Color Intelligence Engine) ──
export const colorRatioDiscipline = {
  canvas_surfaces: "70-90% of interface area",
  brand_accent: "5-15%",
  status_colors: "only where semantically required",
  rules: [
    "Do not use the primary brand color for every control",
    "Do not use the same color role to mean both interactive and decorative content",
    "Never rely on color alone to communicate state",
  ],
};

// ── Get app profile ──
export function getAppProfile() {
  return {
    ...APP_PROFILE,
    recipe: getRecipe(APP_PROFILE.experienceRecipe),
    domainPack: getDomainPack(APP_PROFILE.domainPack),
    mobilePattern: getMobilePattern(APP_PROFILE.mobilePattern),
    colorSystem: getColorSystem(APP_PROFILE.colorSystem),
  };
}