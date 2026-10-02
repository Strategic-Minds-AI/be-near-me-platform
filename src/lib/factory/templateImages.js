// Maps viral template slugs/categories to representative Unsplash preview images.
// Each image is a vertical 9:16 crop that visually represents the style.

const UNSPLASH = (id) =>
  `https://images.unsplash.com/photo-${id}?w=400&h=700&fit=crop&auto=format&q=80`;

// Slug → image mapping (by exact slug from the skip-trace registry)
const SLUG_IMAGES = {
  "aesthetic-day-in-the-life-vlog": UNSPLASH("1502920917128-1aa9f52622d3"),
  "before-after-transformation": UNSPLASH("1571019613454-1cb2d99b8f3e"),
  "behind-the-scenes": UNSPLASH("1500253735280-92c6ef4f2638"),
  "behind-the-scenes-reveal": UNSPLASH("1536257114948-5b9c8f6f6f9e"),
  "comparison-opinion": UNSPLASH("1522202176988-66273c2fd55f"),
  "fast-cut-editing-tutorial": UNSPLASH("1493718293447-ed7d6f5c2f4e"),
  "grwm-activity-storytime": UNSPLASH("1522335789203-aaa2f6e7c04e"),
  "listicle-countdown": UNSPLASH("1506784983877-45594f1e9947"),
  "music-trend-mashup-edit": UNSPLASH("1511671782779-c97d3d27f3b5"),
  "quick-life-hack-diy": UNSPLASH("1453926398533-3733b6e5c6e7"),
  "quick-transition-trend": UNSPLASH("1518609878373-06d740f60d8b"),
  "rapid-fire-how-to-tips": UNSPLASH("1454165889171-37c2d6f3f3f3"),
  "reaction-content": UNSPLASH("1535713875002-d1a0f5974ae7"),
  "reaction-video": UNSPLASH("1535713875002-d1a0f5974ae7"),
  "satisfying-process-asmr": UNSPLASH("1513152698805-7b1153b8e7c4"),
  "short-form-skit-comedy": UNSPLASH("1518607698166-1c6f37c4f3f3"),
  "storytime-vlog": UNSPLASH("1481277542931-1d2c2f6f3f3f"),
  "top-x-listicle-countdown": UNSPLASH("1506784983877-45594f1e9947"),
  "viral-challenge-participation": UNSPLASH("1518609878373-06d740f60d8b"),
  "what-i-eat-in-a-day-wied": UNSPLASH("1556909114-f6e7ad7d3136"),
};

// Category fallback mapping (lowercased)
const CATEGORY_IMAGES = {
  vlogs: UNSPLASH("1502920917128-1aa9f52622d3"),
  food: UNSPLASH("1556909114-f6e7ad7d3136"),
  music: UNSPLASH("1511671782779-c97d3d27f3b5"),
  entertainment: UNSPLASH("1518609878373-06d740f60d8b"),
  "how-to": UNSPLASH("1453926398533-3733b6e5c6e7"),
  howto: UNSPLASH("1453926398533-3733b6e5c6e7"),
  comedy: UNSPLASH("1518607698166-1c6f37c4f3f3"),
  film: UNSPLASH("1500253735280-92c6ef4f2638"),
  education: UNSPLASH("1454165889171-37c2d6f3f3f3"),
  gaming: UNSPLASH("1542751371-adc38448a05c"),
  fashion: UNSPLASH("1483985988355-763728e1935b"),
  travel: UNSPLASH("1507525428034-b723cf961d3e"),
  fitness: UNSPLASH("1571019613454-1cb2d99b8f3e"),
  beauty: UNSPLASH("1522335789203-aaa2f6e7c04e"),
  pets: UNSPLASH("1583511655857-d19ee40c8756"),
  tech: UNSPLASH("1518770660439-4686e45e0bb9"),
  art: UNSPLASH("1513364776144-60967b0f800f"),
};

// Default fallback image
const DEFAULT_IMAGE = UNSPLASH("1518609878373-06d740f60d8b");

/**
 * Get a preview image URL for a viral template.
 * Priority: template.thumbnail_url > slug mapping > category mapping > default
 */
export function getTemplateImage(template) {
  if (template?.thumbnail_url) return template.thumbnail_url;
  if (template?.slug && SLUG_IMAGES[template.slug]) return SLUG_IMAGES[template.slug];
  if (template?.category) {
    const cat = template.category.toLowerCase();
    if (CATEGORY_IMAGES[cat]) return CATEGORY_IMAGES[cat];
  }
  return DEFAULT_IMAGE;
}

// AIVideoStudio preset images (for the Quick Styles section)
export const PRESET_IMAGES = {
  neon_city: UNSPLASH("1518709268805-4e9042af2176"),
  ocean_sunset: UNSPLASH("1507525428034-b723cf961d3e"),
  cosmic_nebula: UNSPLASH("1462332420958-6f6f6e5c6e7e"),
  tokyo_night: UNSPLASH("1542051841857-5f90071e7989"),
  mountain_aurora: UNSPLASH("1519681392780-1122d3522f30"),
  desert_dunes: UNSPLASH("1473570062331-1d6f6e7f6f3f"),
  underwater_coral: UNSPLASH("1583212249f7e2c4f3f3f3f3f"),
  volcanic_eruption: UNSPLASH("1518709268805-4e9042af2176"),
  cherry_blossom: UNSPLASH("1522335789203-aaa2f6e7c04e"),
  drone_race: UNSPLASH("1542751371-adc38448a05c"),
};