import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Download, Loader2, Youtube, CheckCircle2, Video } from "lucide-react";

export default function VideoScraper() {
  const [source, setSource] = useState("");
  const [foundVideos, setFoundVideos] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [importMsg, setImportMsg] = useState("");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const scrapeMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('scrapeVideos', { source });
      return res.data;
    },
    onSuccess: (data) => {
      setFoundVideos(data?.videos || []);
      setSelected(new Set(data?.videos?.map((v) => v.youtube_id) || []));
      setImportMsg("");
    },
    onError: (err) => setImportMsg("Scrape failed: " + err.message),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const ids = foundVideos.filter((v) => selected.has(v.youtube_id)).map((v) => v.youtube_id);
      const res = await base44.functions.invoke('scrapeVideos', {
        source: ids,
        doImport: true,
        channelName: 'Xtreme Polishing Systems',
        category: 'howto',
      });
      return res.data;
    },
    onSuccess: (data) => {
      setImportMsg(`${data?.imported || 0} videos imported to the feed!`);
      setFoundVideos([]);
      setSelected(new Set());
    },
    onError: (err) => setImportMsg("Import failed: " + err.message),
  });

  const toggle = (id) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === foundVideos.length) setSelected(new Set());
    else setSelected(new Set(foundVideos.map((v) => v.youtube_id)));
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-white">
        <p className="text-white/50 mb-4">Sign in to access the video scraper</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="bg-pink-600 hover:bg-pink-700 rounded-full px-8">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 text-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
            <Youtube className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Video Scraper</h1>
            <p className="text-white/50 text-sm">Find and import videos from YouTube into your feed</p>
          </div>
        </div>

        {/* Source input */}
        <Card className="bg-white/[0.04] border-white/10 p-5 mb-6">
          <label className="text-sm font-medium text-white/70 mb-2 block">Source — YouTube channel URL, search query, or video list</label>
          <div className="flex gap-3">
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. https://www.youtube.com/c/XtremePolishingSystems/videos or 'epoxy floor tutorial'"
              className="bg-white/5 border-white/10 text-white flex-1"
              onKeyDown={(e) => { if (e.key === 'Enter' && source.trim()) scrapeMutation.mutate(); }}
            />
            <Button
              onClick={() => scrapeMutation.mutate()}
              disabled={!source.trim() || scrapeMutation.isPending}
              className="bg-pink-600 hover:bg-pink-700 rounded-full px-6"
            >
              {scrapeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
              Find Videos
            </Button>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              "https://www.youtube.com/c/XtremePolishingSystems/videos",
              "epoxy floor installation",
              "concrete polishing tutorial",
            ].map((ex) => (
              <button
                key={ex}
                onClick={() => setSource(ex)}
                className="text-xs text-white/40 hover:text-white/80 bg-white/5 px-3 py-1 rounded-full transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </Card>

        {/* Import message */}
        {importMsg && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4" /> {importMsg}
          </div>
        )}

        {/* Results */}
        {foundVideos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/60">{foundVideos.length} videos found</span>
                <button onClick={toggleAll} className="text-xs text-pink-400 hover:text-pink-300">
                  {selected.size === foundVideos.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={selected.size === 0 || importMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-6"
              >
                {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                Import {selected.size} to Feed
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {foundVideos.map((v) => {
                const isSelected = selected.has(v.youtube_id);
                return (
                  <Card
                    key={v.youtube_id}
                    onClick={() => toggle(v.youtube_id)}
                    className={`bg-white/[0.04] border-2 rounded-2xl overflow-hidden cursor-pointer transition-all ${
                      isSelected ? "border-pink-500 ring-2 ring-pink-500/30" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="relative aspect-video bg-black/40">
                      <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-white line-clamp-2">{v.title}</p>
                      <p className="text-xs text-white/40 mt-1">{v.channel_name}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {foundVideos.length === 0 && !scrapeMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/40 text-sm">Enter a YouTube URL or search query above to find videos</p>
          </div>
        )}
      </div>
    </div>
  );
}