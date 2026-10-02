// Video template registry — pre-defined AI video generation templates.
// Each template has a prompt scaffold, duration, aspect ratio, and style metadata.
// Used by the Builder's Video Templates panel to generate AI video renders.

export const VIDEO_TEMPLATES = [
  {
    id: "vt-hero-product",
    name: "Hero Product Showcase",
    category: "Marketing",
    description: "Cinematic product reveal with dramatic lighting and smooth camera motion.",
    duration: 6,
    aspect_ratio: "16:9",
    generate_audio: false,
    prompt: "A cinematic product showcase video. A sleek modern tech product sitting on a minimalist pedestal, dramatic studio lighting with soft blue and white gradients, slow 360-degree camera rotation, shallow depth of field, premium luxury brand aesthetic, clean dark background with subtle reflections, 4K quality",
    icon: "Package",
  },
  {
    id: "vt-app-demo",
    name: "App Interface Demo",
    category: "Marketing",
    description: "Animated mobile app interface showing key features and user flow.",
    duration: 6,
    aspect_ratio: "9:16",
    generate_audio: false,
    prompt: "A mobile app demo video showing a clean modern interface on a smartphone screen. Smooth animated transitions between app screens, blue accent color scheme, finger tap interactions, floating UI elements, professional product demo aesthetic, soft gradient background",
    icon: "Smartphone",
  },
  {
    id: "vt-brand-story",
    name: "Brand Story Film",
    category: "Brand",
    description: "Emotional brand narrative with cinematic visuals and atmospheric scenes.",
    duration: 8,
    aspect_ratio: "16:9",
    generate_audio: true,
    prompt: "A cinematic brand story film. Opening shot of a modern city skyline at dawn, transitioning to diverse professionals working in bright modern offices, quick cuts of innovation and collaboration, warm golden hour lighting, inspiring and aspirational tone, professional corporate documentary style, smooth camera movements",
    icon: "Film",
  },
  {
    id: "vt-social-loop",
    name: "Social Media Loop",
    category: "Social",
    description: "Vertical looping animation optimized for Instagram/TikTok feeds.",
    duration: 6,
    aspect_ratio: "9:16",
    generate_audio: false,
    prompt: "A vertical social media looping animation. Abstract geometric shapes morphing and flowing in a seamless loop, vibrant blue and purple gradient background, modern motion graphics style, clean minimalist design, perfect loop with no visible cut, high energy and engaging",
    icon: "Repeat",
  },
  {
    id: "vt-dashboard-flythrough",
    name: "Dashboard Flythrough",
    category: "Product",
    description: "3D flythrough of a SaaS dashboard with animated data visualizations.",
    duration: 6,
    aspect_ratio: "16:9",
    generate_audio: false,
    prompt: "A 3D flythrough of a modern SaaS analytics dashboard. Camera glides over interactive charts and data visualizations that animate and update in real-time, blue and white color scheme, glassmorphism UI elements, floating KPI cards, smooth cinematic camera movement, professional tech product aesthetic",
    icon: "BarChart3",
  },
  {
    id: "vt-onboarding-flow",
    name: "Onboarding Flow Preview",
    category: "Product",
    description: "Animated user onboarding sequence showing first-run experience.",
    duration: 8,
    aspect_ratio: "16:9",
    generate_audio: false,
    prompt: "An animated onboarding flow video for a web application. Step-by-step tutorial with highlighted UI elements, smooth transitions between onboarding steps, blue accent highlights, friendly cursor animations showing user interactions, clean white background, modern SaaS onboarding aesthetic",
    icon: "UserPlus",
  },
  {
    id: "vt-landing-hero",
    name: "Landing Page Hero",
    category: "Web",
    description: "Dynamic hero section animation for landing pages with text and CTA reveals.",
    duration: 6,
    aspect_ratio: "16:9",
    generate_audio: false,
    prompt: "A dynamic landing page hero section animation. Bold headline text fading in with a smooth motion, call-to-action button with a subtle glow effect, abstract background with flowing gradient waves in blue tones, modern web design aesthetic, professional and clean, subtle particle effects",
    icon: "LayoutTemplate",
  },
  {
    id: "vt-testimonial",
    name: "Customer Testimonial",
    category: "Marketing",
    description: "Professional customer testimonial with portrait and quote reveal.",
    duration: 8,
    aspect_ratio: "16:9",
    generate_audio: true,
    prompt: "A professional customer testimonial video. A confident business professional in a modern office setting, soft cinematic lighting, shallow depth of field, clean background with subtle bokeh, lower third text overlay area, corporate interview aesthetic, warm and trustworthy tone",
    icon: "MessageSquare",
  },
];

export const VIDEO_CATEGORIES = ["All", "Marketing", "Brand", "Product", "Social", "Web"];

export function getVideoTemplate(id) {
  return VIDEO_TEMPLATES.find((t) => t.id === id);
}