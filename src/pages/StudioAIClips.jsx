import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import StudioSidebar from "@/components/studio/StudioSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Scissors, Sparkles, Loader2, Play, Type, Image, BookOpen, FileText, Copy, Check, ChevronDown, ChevronUp
} from "lucide-react";

export default function StudioAIClips() {
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const [expandedSection, setExpandedSection] = useState("clips");

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: videos } = useQuery({
    queryKey: ['myVideosForClips', user?.email],
    queryFn: () => base44.entities.Video.filter({ created_by: user?.email }, '-created_date', 50),
    enabled: !!user?.email,
  });

  const generate = async () => {
    if (!selectedVideoId) return;
    setIsGenerating(true);
    setResults(null);
    setError(null);
    const res = await base44.functions.invoke('aiClipFactory', { videoId: selectedVideoId });
    if (res.data?.error) setError(res.data.error);
    else setResults(res.data);
    setIsGenerating(false);
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const Section = ({ id, icon: Icon, title, count, children }) => (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="cursor-pointer pb-3" onClick={() => setExpandedSection(expandedSection === id ? null : id)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Icon className="w-5 h-5 text-purple-400" />
            {title}
            {count && <Badge className="bg-purple-500/20 text-purple-300 ml-1">{count}</Badge>}
          </CardTitle>
          {expandedSection === id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </CardHeader>
      {expandedSection === id && <CardContent>{children}</CardContent>}
    </Card>
  );

  return (
    <div className="flex min-h-screen bg-[#0f0f0f]">
      <StudioSidebar currentPage="StudioAIClips" />
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Clip Factory</h1>
                <p className="text-gray-400 text-sm">Upload once → get clips, titles, thumbnails, chapters & description</p>
              </div>
            </div>
          </div>

          {/* Video selector */}
          <Card className="bg-white/5 border-white/10 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium mb-2">Select a video to analyze</p>
                  <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choose a video..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#212121] border-white/10 max-h-60">
                      {videos?.map(v => (
                        <SelectItem key={v.id} value={v.id} className="text-white">
                          <span className="truncate max-w-xs block">{v.title}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={generate}
                  disabled={!selectedVideoId || isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl px-8 self-end"
                >
                  {isGenerating
                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>
                    : <><Sparkles className="w-4 h-4 mr-2" />Generate Assets</>}
                </Button>
              </div>
              {isGenerating && (
                <div className="mt-4 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <p className="text-purple-300 text-sm">🤖 AI is analyzing your video and generating clips, titles, thumbnails, chapters, and SEO description...</p>
                </div>
              )}
              {error && (
                <div className="mt-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {results && (
            <div className="space-y-4">
              {/* Clips */}
              <Section id="clips" icon={Scissors} title="Short Clips" count={results.assets?.clips?.length}>
                <div className="space-y-3">
                  {results.assets?.clips?.map((clip, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Play className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{clip.title}</p>
                        <p className="text-gray-500 text-sm mt-1">
                          {clip.start_seconds}s → {clip.end_seconds}s ({clip.end_seconds - clip.start_seconds}s)
                        </p>
                        <p className="text-gray-400 text-sm mt-1 italic">"{clip.hook}"</p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 flex-shrink-0">{clip.category_fit}</Badge>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Title variants */}
              <Section id="titles" icon={Type} title="Title Variants" count={results.assets?.title_variants?.length}>
                <div className="space-y-2">
                  {results.assets?.title_variants?.map((title, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl group">
                      <p className="flex-1 text-white text-sm">{title}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyText(title, `title_${i}`)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                      >
                        {copied === `title_${i}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Thumbnail concepts */}
              <Section id="thumbnails" icon={Image} title="Thumbnail Concepts" count={results.assets?.thumbnail_concepts?.length}>
                <div className="grid sm:grid-cols-2 gap-3">
                  {results.assets?.thumbnail_concepts?.map((t, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                      <p className="text-white text-sm font-medium">{t.concept}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge className="bg-white/10 text-gray-300">"{t.text_overlay}"</Badge>
                        <Badge className="bg-white/10 text-gray-300">{t.color_scheme}</Badge>
                        <Badge className="bg-white/10 text-gray-300">{t.emotion}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Chapters */}
              <Section id="chapters" icon={BookOpen} title="Video Chapters" count={results.assets?.chapters?.length}>
                <div className="space-y-2">
                  {results.assets?.chapters?.map((ch, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                      <span className="text-blue-400 font-mono text-sm w-16 flex-shrink-0">{ch.timestamp}</span>
                      <span className="text-white text-sm">{ch.title}</span>
                    </div>
                  ))}
                </div>
              </Section>

              {/* SEO Description */}
              <Section id="description" icon={FileText} title="SEO Description">
                <div className="relative">
                  <p className="text-gray-300 text-sm whitespace-pre-wrap bg-white/5 rounded-xl p-4 leading-relaxed">
                    {results.assets?.seo_description}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyText(results.assets?.seo_description, 'desc')}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  >
                    {copied === 'desc' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}