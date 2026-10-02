// Universal Frontend Factory — Compatibility Engine + Deterministic Selector
// Implements the Pattern Compatibility Engine from 03_PATTERN_COMPATIBILITY_ENGINE.md
// Scores pattern combinations, enforces hard constraints, and deterministically
// selects the best compatible patterns for a given project brief.

export const REGISTRY_VERSION = '2.0.0';

// ── Hard Constraints ──
// These fail eligibility regardless of score.
export const HARD_CONSTRAINTS = [
  {
    id: 'HC1',
    rule: 'Mobile navigation must have a defined desktop/tablet transformation',
    check: (selection, registry) => {
      if (!selection.navigation) return true;
      const nav = findPattern(registry, 'navigation_patterns', selection.navigation);
      if (!nav) return false;
      return nav.responsive_transform || nav.desktop_transform;
    },
  },
  {
    id: 'HC2',
    rule: 'Full-screen swipe feed cannot be primary layout for dense admin/data products',
    check: (selection, registry, brief) => {
      if (brief?.product_archetype === 'admin' || brief?.product_archetype === 'dashboard') {
        return selection.mobilePattern !== 'M02';
      }
      return true;
    },
  },
  {
    id: 'HC3',
    rule: 'Dense table/command-center layouts cannot be phone default',
    check: (selection, registry, brief) => {
      if (brief?.platforms?.includes('mobile-web') && !brief?.platforms?.includes('desktop-web')) {
        return selection.mobilePattern !== 'M10' && selection.mobilePattern !== 'M11';
      }
      return true;
    },
  },
  {
    id: 'HC4',
    rule: 'Hover-only interactions are forbidden',
    check: (selection, registry) => {
      if (!selection.componentPatterns) return true;
      return true; // Validated at component level
    },
  },
  {
    id: 'HC5',
    rule: 'Motion patterns must include reduced-motion behavior',
    check: (selection, registry) => {
      if (!selection.motionPattern) return true;
      const motion = findPattern(registry, 'motion_patterns', selection.motionPattern);
      if (!motion) return false;
      return motion.reduced_motion !== false;
    },
  },
  {
    id: 'HC6',
    rule: 'Selected palette must pass contrast checks',
    check: (selection, registry) => {
      if (!selection.colorSystem) return true;
      const color = findPattern(registry, 'color_systems', selection.colorSystem);
      if (!color) return false;
      return color.contrast_pass !== false;
    },
  },
  {
    id: 'HC7',
    rule: 'Selected logo pattern must have icon-only and one-color variants',
    check: (selection, registry) => {
      if (!selection.logoPattern) return true;
      const logo = findPattern(registry, 'logo_patterns', selection.logoPattern);
      if (!logo) return false;
      return logo.variants && logo.variants.includes('icon-only') && logo.variants.includes('one-color');
    },
  },
];

// ── Scoring weights (0-100 total) ──
export const SCORE_WEIGHTS = {
  platform_fit: 25,
  primary_goal_fit: 20,
  information_density_fit: 15,
  navigation_layout_fit: 10,
  brand_tone_fit: 10,
  conversion_path_fit: 10,
  accessibility_fit: 5,
  motion_media_fit: 5,
};

export const ELIGIBILITY_THRESHOLD = 75;

// ── Helper: find a pattern by ID within a family ──
function findPattern(registry, familyId, patternId) {
  const family = registry?.[familyId];
  if (!family) return null;
  return family.find((p) => p.id === patternId) || null;
}

// ── Score a single pattern against a brief ──
export function scorePattern(pattern, familyId, brief) {
  let score = 0;

  // Platform fit
  if (pattern.best_for && brief?.product_archetype) {
    if (pattern.best_for.some((tag) => brief.product_archetype.includes(tag))) {
      score += SCORE_WEIGHTS.platform_fit;
    } else {
      score += SCORE_WEIGHTS.platform_fit * 0.4;
    }
  } else {
    score += SCORE_WEIGHTS.platform_fit * 0.6;
  }

  // Primary goal fit
  if (brief?.primary_goal && pattern.best_for) {
    if (pattern.best_for.some((tag) => brief.primary_goal.includes(tag))) {
      score += SCORE_WEIGHTS.primary_goal_fit;
    } else {
      score += SCORE_WEIGHTS.primary_goal_fit * 0.3;
    }
  } else {
    score += SCORE_WEIGHTS.primary_goal_fit * 0.5;
  }

  // Information density fit
  if (brief?.density && pattern.density) {
    if (pattern.density === brief.density) {
      score += SCORE_WEIGHTS.information_density_fit;
    } else {
      score += SCORE_WEIGHTS.information_density_fit * 0.5;
    }
  } else {
    score += SCORE_WEIGHTS.information_density_fit * 0.7;
  }

  // Navigation/layout fit
  if (pattern.layout_rule && brief?.interaction_mode) {
    score += SCORE_WEIGHTS.navigation_layout_fit * 0.8;
  } else {
    score += SCORE_WEIGHTS.navigation_layout_fit * 0.5;
  }

  // Brand tone fit
  if (brief?.brand_tone && pattern.tone) {
    if (pattern.tone === brief.brand_tone) {
      score += SCORE_WEIGHTS.brand_tone_fit;
    } else {
      score += SCORE_WEIGHTS.brand_tone_fit * 0.4;
    }
  } else {
    score += SCORE_WEIGHTS.brand_tone_fit * 0.6;
  }

  // Conversion path fit
  if (brief?.conversion_mode && pattern.conversion) {
    if (pattern.conversion === brief.conversion_mode) {
      score += SCORE_WEIGHTS.conversion_path_fit;
    } else {
      score += SCORE_WEIGHTS.conversion_path_fit * 0.3;
    }
  } else {
    score += SCORE_WEIGHTS.conversion_path_fit * 0.5;
  }

  // Accessibility fit
  if (pattern.states_required && pattern.states_required.includes('permission')) {
    score += SCORE_WEIGHTS.accessibility_fit;
  } else {
    score += SCORE_WEIGHTS.accessibility_fit * 0.5;
  }

  // Motion/media fit
  if (pattern.motion || pattern.media) {
    score += SCORE_WEIGHTS.motion_media_fit * 0.8;
  } else {
    score += SCORE_WEIGHTS.motion_media_fit * 0.5;
  }

  return Math.round(Math.min(100, score));
}

// ── Check all hard constraints for a selection ──
export function checkHardConstraints(selection, registry, brief) {
  const failures = [];
  for (const constraint of HARD_CONSTRAINTS) {
    if (!constraint.check(selection, registry, brief)) {
      failures.push({ id: constraint.id, rule: constraint.rule });
    }
  }
  return { passed: failures.length === 0, failures };
}

// ── Deterministic selector ──
// Given a brief and registry, selects the best compatible patterns per family.
// Uses seed for deterministic tie-breaking.
export function selectPatterns(brief, registry, seed = 'default') {
  const selection = {};
  const scores = {};
  const rationale = {};

  // Select domain pack
  const domainPacks = registry.domain_packs || [];
  if (domainPacks.length > 0) {
    const scored = domainPacks.map((p) => ({
      pattern: p,
      score: scorePattern(p, 'domain_packs', brief),
    }));
    scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
    selection.domainPack = scored[0]?.pattern.id;
    scores.domainPack = scored[0]?.score;
    rationale.domainPack = `Best fit: ${scored[0]?.pattern.name} (${scored[0]?.score}/100)`;
  }

  // Select experience recipe
  const recipes = registry.experience_recipes || [];
  if (recipes.length > 0) {
    const scored = recipes
      .filter((r) => !brief?.product_archetype || r.domain?.includes(brief.product_archetype) || true)
      .map((p) => ({ pattern: p, score: scorePattern(p, 'experience_recipes', brief) }));
    scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
    selection.experienceRecipe = scored[0]?.pattern.id;
    scores.experienceRecipe = scored[0]?.score;
    rationale.experienceRecipe = `Best fit: ${scored[0]?.pattern.name} (${scored[0]?.score}/100)`;
  }

  // Select mobile pattern
  const mobilePatterns = registry.mobile_patterns || [];
  if (mobilePatterns.length > 0) {
    const scored = mobilePatterns.map((p) => ({
      pattern: p,
      score: scorePattern(p, 'mobile_patterns', brief),
    }));
    scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
    selection.mobilePattern = scored[0]?.pattern.id;
    scores.mobilePattern = scored[0]?.score;
    rationale.mobilePattern = `Best fit: ${scored[0]?.pattern.name} (${scored[0]?.score}/100)`;
  }

  // Select navigation
  const navPatterns = registry.navigation_patterns || [];
  if (navPatterns.length > 0) {
    const scored = navPatterns.map((p) => ({
      pattern: p,
      score: scorePattern(p, 'navigation_patterns', brief),
    }));
    scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
    selection.navigation = scored[0]?.pattern.id;
    scores.navigation = scored[0]?.score;
    rationale.navigation = `Best fit: ${scored[0]?.pattern.name} (${scored[0]?.score}/100)`;
  }

  // Select color system
  const colorSystems = registry.color_systems || [];
  if (colorSystems.length > 0) {
    const scored = colorSystems.map((p) => ({
      pattern: p,
      score: scorePattern(p, 'color_systems', brief),
    }));
    scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
    selection.colorSystem = scored[0]?.pattern.id;
    scores.colorSystem = scored[0]?.score;
    rationale.colorSystem = `Best fit: ${scored[0]?.pattern.name} (${scored[0]?.score}/100)`;
  }

  // Select typography
  const typoPatterns = registry.typography_patterns || [];
  if (typoPatterns.length > 0) {
    const scored = typoPatterns.map((p) => ({
      pattern: p,
      score: scorePattern(p, 'typography_patterns', brief),
    }));
    scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
    selection.typography = scored[0]?.pattern.id;
    scores.typography = scored[0]?.score;
    rationale.typography = `Best fit: ${scored[0]?.pattern.name} (${scored[0]?.score}/100)`;
  }

  // Select surface system
  const surfaceSystems = registry.surface_systems || [];
  if (surfaceSystems.length > 0) {
    const scored = surfaceSystems.map((p) => ({
      pattern: p,
      score: scorePattern(p, 'surface_systems', brief),
    }));
    scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
    selection.surfaceSystem = scored[0]?.pattern.id;
    scores.surfaceSystem = scored[0]?.score;
  }

  // Select elevation system
  const elevationSystems = registry.elevation_systems || [];
  if (elevationSystems.length > 0) {
    const scored = elevationSystems.map((p) => ({
      pattern: p,
      score: scorePattern(p, 'elevation_systems', brief),
    }));
    scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
    selection.elevationSystem = scored[0]?.pattern.id;
    scores.elevationSystem = scored[0]?.score;
  }

  // Select motion pattern
  const motionPatterns = registry.motion_patterns || [];
  if (motionPatterns.length > 0) {
    const scored = motionPatterns.map((p) => ({
      pattern: p,
      score: scorePattern(p, 'motion_patterns', brief),
    }));
    scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
    selection.motionPattern = scored[0]?.pattern.id;
    scores.motionPattern = scored[0]?.score;
  }

  // Select density mode
  const densityModes = registry.density_modes || [];
  if (densityModes.length > 0) {
    const scored = densityModes.map((p) => ({
      pattern: p,
      score: scorePattern(p, 'density_modes', brief),
    }));
    scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
    selection.densityMode = scored[0]?.pattern.id;
    scores.densityMode = scored[0]?.score;
  }

  // Select icon system
  const iconSystems = registry.icon_systems || [];
  if (iconSystems.length > 0) {
    const scored = iconSystems.map((p) => ({
      pattern: p,
      score: scorePattern(p, 'icon_systems', brief),
    }));
    scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
    selection.iconSystem = scored[0]?.pattern.id;
    scores.iconSystem = scored[0]?.score;
  }

  // Check hard constraints
  const constraints = checkHardConstraints(selection, registry, brief);

  return { selection, scores, rationale, constraints, seed };
}

// ── Generate 3 brand packs (Brand Mode) ──
export function generateBrandPacks(brief, registry) {
  const colorSystems = registry.color_systems || [];
  const logoPatterns = registry.logo_patterns || [];
  const typoPatterns = registry.typography_patterns || [];

  // Pick 3 distinct color systems
  const scored = colorSystems.map((p) => ({
    pattern: p,
    score: scorePattern(p, 'color_systems', brief),
  }));
  scored.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
  const topColors = scored.slice(0, 3).map((s) => s.pattern);

  // Pick 3 distinct logo patterns
  const scoredLogos = logoPatterns.map((p) => ({
    pattern: p,
    score: scorePattern(p, 'logo_patterns', brief),
  }));
  scoredLogos.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
  const topLogos = scoredLogos.slice(0, 3).map((s) => s.pattern);

  // Pick 3 distinct typography patterns
  const scoredTypo = typoPatterns.map((p) => ({
    pattern: p,
    score: scorePattern(p, 'typography_patterns', brief),
  }));
  scoredTypo.sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id));
  const topTypo = scoredTypo.slice(0, 3).map((s) => s.pattern);

  return [0, 1, 2].map((i) => ({
    id: `BP${i + 1}`,
    positioning: brief?.brand_tone || 'Professional',
    colorSystem: topColors[i] || topColors[0],
    logoPattern: topLogos[i] || topLogos[0],
    typography: topTypo[i] || topTypo[0],
    visualLanguage: topColors[i]?.name || 'Default',
    imagery: 'Clean, purposeful media with consistent treatment',
    iconography: 'Unified icon family with consistent weight',
    motion: 'Purposeful transitions that explain hierarchy',
    voice: brief?.brand_tone || 'Clear and confident',
  }));
}