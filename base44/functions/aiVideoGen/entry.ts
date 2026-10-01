import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { generateVideo } from "../../shared/vercelAiGateway.ts";

// 10 one-tap AI video presets. Single source of truth for the AIVideoStudio page.
// Now powered by Vercel AI Gateway (Veo 3.1) — no Base44 integration credits required.
const PRESETS = {
  neon_city: {
    title: "Neon Cyberpunk City",
    category: "entertainment",
    prompt: "A neon-drenched cyberpunk city at night, flying cars streaking between skyscrapers, rain reflecting pink and cyan light, cinematic vertical 9:16 shot, moody atmospheric, slow forward dolly, volumetric fog, ultra detailed",
  },
  ocean_sunset: {
    title: "Ocean Sunset",
    category: "travel",
    prompt: "A serene ocean sunset with warm golden light, gentle rolling waves, sun dipping below the horizon, cinematic vertical 9:16, calm and peaceful, soft lens flare, ultra detailed",
  },
  cosmic_nebula: {
    title: "Cosmic Nebula Flythrough",
    category: "film",
    prompt: "A cosmic flythrough through a vibrant magenta and silver nebula, swirling gas clouds, distant stars twinkling, cinematic vertical 9:16, awe-inspiring, slow forward motion, ultra detailed",
  },
  tokyo_night: {
    title: "Tokyo Street at Night",
    category: "travel",
    prompt: "A bustling Tokyo street at night, glowing neon signs in pink and cyan, light rain, people with umbrellas crossing, cinematic vertical 9:16, reflections on wet pavement, energetic, ultra detailed",
  },
  mountain_aurora: {
    title: "Mountain Aurora",
    category: "travel",
    prompt: "A snowy mountain range under a vivid aurora borealis, green and magenta ribbons of light, still icy lake reflection, cinematic vertical 9:16, serene and majestic, ultra detailed",
  },
  desert_dunes: {
    title: "Desert Dunes at Dawn",
    category: "travel",
    prompt: "Golden desert dunes at dawn, wind-sculpted sand ridges, soft pink and amber light, long shadows, cinematic vertical 9:16, calm and minimal, ultra detailed",
  },
  underwater_coral: {
    title: "Underwater Coral Reef",
    category: "pets",
    prompt: "A vibrant underwater coral reef, tropical fish swimming, sun rays piercing the surface, colorful coral, cinematic vertical 9:16, serene and luminous, ultra detailed",
  },
  volcanic_eruption: {
    title: "Volcanic Eruption",
    category: "film",
    prompt: "A dramatic volcanic eruption at night, glowing lava fountains, billowing smoke lit orange, sparks flying, cinematic vertical 9:16, intense and powerful, ultra detailed",
  },
  cherry_blossom: {
    title: "Cherry Blossom Garden",
    category: "art",
    prompt: "Cherry blossom petals falling in a serene Japanese garden, soft pink light, a quiet koi pond, cinematic vertical 9:16, peaceful and poetic, slow motion, ultra detailed",
  },
  drone_race: {
    title: "Futuristic Drone Race",
    category: "tech",
    prompt: "A futuristic drone racing at high speed through a neon city, FPV vertical 9:16, motion blur, pink and cyan light trails, exhilarating, ultra detailed",
  },
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({})) || {};
    const preset = PRESETS[body.presetId];
    if (!preset) return Response.json({ error: "Unknown preset" }, { status: 400 });

    // Resolve the creator's channel for attribution
    const chRes = await base44.entities.Channel.filter({ created_by: user.email });
    const channel = Array.isArray(chRes) ? chRes[0] : chRes?.items?.[0];

    // Generate the video via Vercel AI Gateway (Veo 3.1)
    const gen = await generateVideo(preset.prompt, { duration: 6, aspectRatio: "9:16" });

    if (!gen?.url) return Response.json({ error: "Generation returned no video" }, { status: 502 });

    // Persist as a public Video so it lands in the feed
    const video = await base44.entities.Video.create({
      title: preset.title,
      url: gen.url,
      thumbnail_url: gen.url,
      category: preset.category,
      duration: 6,
      channel_id: channel?.id,
      channel_name: channel?.name,
      channel_avatar: channel?.avatar_url,
      visibility: "public",
      processing_status: "done",
    });

    return Response.json({
      url: gen.url,
      videoId: video.id,
      title: preset.title,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}