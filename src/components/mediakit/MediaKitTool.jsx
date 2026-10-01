import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";

export default function MediaKitTool({ onGenerate, isGenerating }) {
  const [formData, setFormData] = useState({
    name: "",
    niche: "",
    platform: "",
    followers: "",
    ageRange: "",
    experience: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-pink-500/20 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center">
          <Sparkles className="text-white" size={20} />
        </div>
        <h2 className="text-xl font-bold text-white">
          Influencer Media Kit Generator
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-300">Influencer Name</Label>
          <Input
            placeholder="Your name or brand"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-pink-500 focus:ring-pink-500"
            required
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-300">Primary Niche</Label>
          <Select value={formData.niche} onValueChange={(v) => setFormData({ ...formData, niche: v })} required>
            <SelectTrigger className="mt-1 rounded-xl bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select your niche" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
              <SelectItem value="Lifestyle">Lifestyle</SelectItem>
              <SelectItem value="Fitness">Fitness</SelectItem>
              <SelectItem value="Tech">Tech</SelectItem>
              <SelectItem value="Beauty">Beauty</SelectItem>
              <SelectItem value="Gaming">Gaming</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Food">Food</SelectItem>
              <SelectItem value="Travel">Travel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-300">Main Platform</Label>
          <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })} required>
            <SelectTrigger className="mt-1 rounded-xl bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="YouTube">YouTube</SelectItem>
              <SelectItem value="TikTok">TikTok</SelectItem>
              <SelectItem value="Be Near Me">Be Near Me</SelectItem>
              <SelectItem value="Multi-platform">Multi-platform</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-300">Follower Count</Label>
          <Input
            placeholder="e.g. 50,000"
            value={formData.followers}
            onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
            className="mt-1 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            required
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-300">Audience Age Range</Label>
          <Input
            placeholder="e.g. 18-34"
            value={formData.ageRange}
            onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
            className="mt-1 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            required
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-300">Brand Collaboration Experience</Label>
          <Select value={formData.experience} onValueChange={(v) => setFormData({ ...formData, experience: v })} required>
            <SelectTrigger className="mt-1 rounded-xl bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Your experience level" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Some collaborations">Some collaborations</SelectItem>
              <SelectItem value="Experienced influencer">Experienced influencer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white hover:opacity-90 rounded-xl py-3 text-base font-semibold mt-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2" size={18} />
              Generate Media Kit
            </>
          )}
        </Button>
      </form>
    </div>
  );
}