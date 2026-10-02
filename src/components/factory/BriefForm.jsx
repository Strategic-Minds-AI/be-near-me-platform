import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';

const ARCHETYPES = [
  'saas', 'marketplace', 'social', 'ecommerce', 'dashboard',
  'crm', 'directory', 'booking', 'ai_platform', 'admin_portal',
  'lead_gen', 'content', 'analytics', 'consulting'
];

const PLATFORMS = ['mobile-web', 'ios-like', 'android-like', 'tablet', 'desktop-web', 'pwa'];

const DENSITIES = ['low', 'medium', 'high'];
const INTERACTION_MODES = ['browse', 'create', 'transact', 'monitor', 'communicate', 'analyze'];
const CONVERSION_MODES = ['none', 'signup', 'purchase', 'lead', 'booking', 'quote'];

const glassInput = 'h-11 bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-xl px-3.5 placeholder:text-white/30 focus:border-[#ff85e0]/40 focus:shadow-[0_0_20px_rgba(255,133,224,0.08)] transition-all';
const glassSelect = 'h-11 bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-xl px-3.5 focus:border-[#ff85e0]/40 focus:shadow-[0_0_20px_rgba(255,133,224,0.08)] transition-all appearance-none';

export default function BriefForm({ onSubmit, initial }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    company_name: initial?.company_name || '',
    product_archetype: initial?.product_archetype || 'saas',
    platforms: initial?.platforms || ['desktop-web'],
    primary_goal: initial?.primary_goal || '',
    target_audience: initial?.target_audience || '',
    industry: initial?.industry || '',
    density: initial?.density || 'medium',
    interaction_mode: initial?.interaction_mode || 'browse',
    conversion_mode: initial?.conversion_mode || 'signup',
    brand_tone: initial?.brand_tone || 'Professional',
    seed: initial?.seed || 'factory-' + Date.now().toString(36),
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const togglePlatform = (p) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-5 max-w-2xl mx-auto pb-8">
      <div className="mb-2">
        <h2 className="text-white text-2xl font-bold tracking-tight">Project Brief</h2>
        <p className="text-[#a0a0a0] text-sm mt-1">Define your project to generate compatible patterns.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-white/70 text-xs mb-1.5 block">Project Name</Label>
          <Input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="My SaaS App"
            className={glassInput}
            required
          />
        </div>
        <div>
          <Label className="text-white/70 text-xs mb-1.5 block">Company</Label>
          <Input
            value={form.company_name}
            onChange={(e) => update('company_name', e.target.value)}
            placeholder="Acme Inc."
            className={glassInput}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-white/70 text-xs mb-1.5 block">Product Archetype</Label>
          <select
            value={form.product_archetype}
            onChange={(e) => update('product_archetype', e.target.value)}
            className={`w-full ${glassSelect}`}
          >
            {ARCHETYPES.map((a) => (
              <option key={a} value={a} className="bg-[#1a1a1a]">{a}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-white/70 text-xs mb-1.5 block">Industry</Label>
          <Input
            value={form.industry}
            onChange={(e) => update('industry', e.target.value)}
            placeholder="Technology"
            className={glassInput}
          />
        </div>
      </div>

      <div>
        <Label className="text-white/70 text-xs mb-2 block">Platforms</Label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
                form.platforms.includes(p)
                  ? 'bg-[#ff85e0] border-[#ff85e0] text-black shadow-[0_0_20px_rgba(255,133,224,0.2)]'
                  : 'bg-[#1a1a1a] border-white/10 text-[#a0a0a0] hover:border-white/20'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-white/70 text-xs mb-1.5 block">Primary Goal</Label>
        <Textarea
          value={form.primary_goal}
          onChange={(e) => update('primary_goal', e.target.value)}
          placeholder="What should users accomplish? e.g. 'Manage CRM pipeline and track deals'"
          className="bg-[#1a1a1a] border-white/10 text-white text-sm rounded-xl placeholder:text-white/30 focus:border-[#ff85e0]/40 focus:shadow-[0_0_20px_rgba(255,133,224,0.08)] transition-all min-h-24"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-white/70 text-xs mb-1.5 block">Density</Label>
          <select
            value={form.density}
            onChange={(e) => update('density', e.target.value)}
            className={`w-full ${glassSelect}`}
          >
            {DENSITIES.map((d) => (
              <option key={d} value={d} className="bg-[#1a1a1a]">{d}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-white/70 text-xs mb-1.5 block">Interaction</Label>
          <select
            value={form.interaction_mode}
            onChange={(e) => update('interaction_mode', e.target.value)}
            className={`w-full ${glassSelect}`}
          >
            {INTERACTION_MODES.map((m) => (
              <option key={m} value={m} className="bg-[#1a1a1a]">{m}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-white/70 text-xs mb-1.5 block">Conversion</Label>
          <select
            value={form.conversion_mode}
            onChange={(e) => update('conversion_mode', e.target.value)}
            className={`w-full ${glassSelect}`}
          >
            {CONVERSION_MODES.map((c) => (
              <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-white/70 text-xs mb-1.5 block">Target Audience</Label>
          <Input
            value={form.target_audience}
            onChange={(e) => update('target_audience', e.target.value)}
            placeholder="Sales teams, SMB owners"
            className={glassInput}
          />
        </div>
        <div>
          <Label className="text-white/70 text-xs mb-1.5 block">Brand Tone</Label>
          <Input
            value={form.brand_tone}
            onChange={(e) => update('brand_tone', e.target.value)}
            placeholder="Professional, Friendly, Bold"
            className={glassInput}
          />
        </div>
      </div>

      <div>
        <Label className="text-white/70 text-xs mb-1.5 block">Deterministic Seed</Label>
        <Input
          value={form.seed}
          onChange={(e) => update('seed', e.target.value)}
          className={`${glassInput} font-mono text-xs`}
        />
        <p className="text-white/30 text-[10px] mt-1.5">
          Same seed + same brief = same selection. Reproducible builds.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full h-12 bg-[#ff85e0] hover:bg-[#ff5cc7] text-black font-semibold text-sm rounded-xl shadow-[0_0_30px_rgba(255,133,224,0.25)]"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Generate Compatible Patterns
      </Button>
    </form>
  );
}