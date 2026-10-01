import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X, RefreshCw, Sticker, ImagePlus, Loader2, Check, AlertCircle, Upload as UploadIcon } from "lucide-react";

const FILTERS = {
  none: "none",
  vivid: "saturate(1.6) contrast(1.1)",
  vintage: "sepia(0.4) contrast(1.1) brightness(1.05) saturate(1.2)",
  mono: "grayscale(1) contrast(1.1)",
  warm: "sepia(0.3) saturate(1.3) hue-rotate(-10deg) brightness(1.03)",
  cool: "saturate(1.2) hue-rotate(180deg) brightness(0.98) contrast(1.05)",
  dreamy: "blur(0.6px) brightness(1.12) saturate(1.35) contrast(0.92)",
  neon: "contrast(1.45) saturate(2) brightness(1.12)",
  glitch: "contrast(1.3) saturate(1.6) hue-rotate(90deg)",
  sepia: "sepia(1) brightness(1.05)",
};
const FILTER_ORDER = ["none", "vivid", "vintage", "mono", "warm", "cool", "dreamy", "neon", "glitch", "sepia"];

const CHARACTERS = ["🐶", "🤖", "👽", "🦊", "🐱", "👻", "🤡", "🦄", "🐸", "🐉"];
const MAX_SECONDS = 60;

function pickMime() {
  const opts = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const o of opts) if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(o)) return o;
  return "video/webm";
}

export default function Camera() {
  const navigate = useNavigate();
  const [facing, setFacing] = useState("user");
  const [filter, setFilter] = useState("none");
  const [stickers, setStickers] = useState([]); // {id, emoji, x, y, size}
  const [showChars, setShowChars] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [posting, setPosting] = useState(false);
  const [ready, setReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const rafRef = useRef(null);
  const startTimeRef = useRef(0);
  const timerRef = useRef(null);
  const dragRef = useRef(null);
  const videoBlobRef = useRef(null);
  const thumbBlobRef = useRef(null);

  const { data: user } = useQuery({ queryKey: ["currentUser"], queryFn: () => base44.auth.me() });
  const { data: channel } = useQuery({
    queryKey: ["myChannel", user?.email],
    queryFn: () => base44.entities.Channel.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });
  const myChannel = channel?.[0];

  // Start camera
  const startCamera = useCallback(async () => {
    setError(null);
    setReady(false);
    try {
      const prev = streamRef.current;
      if (prev) prev.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play().catch(() => {});
      }
      setReady(true);
    } catch (e) {
      setError(e?.message || "Camera access denied. Check browser permissions.");
    }
  }, [facing]);

  useEffect(() => {
    startCamera();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  // Render loop
  const draw = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || v.readyState < 2) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }
    if (c.width !== 720) c.width = 720;
    if (c.height !== 1280) c.height = 1280;
    const ctx = c.getContext("2d");
    ctx.save();
    ctx.filter = FILTERS[filter] || "none";
    const mirror = facing === "user";
    if (mirror) { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    const vRatio = v.videoWidth / v.videoHeight || 9 / 16;
    const cRatio = c.width / c.height;
    let dw, dh, dx, dy;
    if (vRatio > cRatio) { dh = c.height; dw = dh * vRatio; dx = (c.width - dw) / 2; dy = 0; }
    else { dw = c.width; dh = dw / vRatio; dx = 0; dy = (c.height - dh) / 2; }
    ctx.drawImage(v, dx, dy, dw, dh);
    ctx.restore();
    ctx.filter = "none";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    stickers.forEach((s) => {
      ctx.font = `${s.size}px serif`;
      ctx.fillText(s.emoji, s.x, s.y);
    });
    rafRef.current = requestAnimationFrame(draw);
  }, [filter, facing, stickers]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Recording
  const startRecording = () => {
    if (!canvasRef.current || !streamRef.current) return;
    chunksRef.current = [];
    const cs = canvasRef.current.captureStream(30);
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) cs.addTrack(audioTrack);
    try {
      const rec = new MediaRecorder(cs, { mimeType: pickMime() });
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        videoBlobRef.current = blob;
        setRecordedUrl(URL.createObjectURL(blob));
        try {
          canvasRef.current.toBlob((b) => (thumbBlobRef.current = b), "image/jpeg", 0.9);
        } catch {}
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      startTimeRef.current = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => {
        const s = (Date.now() - startTimeRef.current) / 1000;
        setElapsed(s);
        if (s >= MAX_SECONDS) stopRecording();
      }, 200);
    } catch (e) {
      setError("Recording not supported in this browser.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    setRecording(false);
  };

  const retake = () => {
    setRecordedUrl(null);
    videoBlobRef.current = null;
    thumbBlobRef.current = null;
  };

  const postMutation = useMutation({
    mutationFn: async () => {
      setPosting(true);
      const blob = videoBlobRef.current;
      const file = new File([blob], `clip-${Date.now()}.webm`, { type: "video/webm" });
      const vRes = await base44.integrations.Core.UploadFile({ file });
      let thumbUrl = "";
      if (thumbBlobRef.current) {
        const tRes = await base44.integrations.Core.UploadFile({ file: new File([thumbBlobRef.current], "thumb.jpg", { type: "image/jpeg" }) });
        thumbUrl = tRes.file_url;
      }
      const newVideo = await base44.entities.Video.create({
        title: `Clip ${new Date().toLocaleString()}`,
        description: "",
        url: vRes.file_url,
        thumbnail_url: thumbUrl,
        category: "entertainment",
        tags: ["camera", "bnearme"],
        visibility: "public",
        monetized: false,
        processing_status: "done",
        channel_id: myChannel?.id,
        channel_name: myChannel?.name || user?.full_name,
        channel_avatar: myChannel?.avatar_url || "",
        views: 0, likes: 0, dislikes: 0, comments_count: 0,
        published_at: new Date().toISOString(),
      });
      if (myChannel) {
        await base44.entities.Channel.update(myChannel.id, { videos_count: (myChannel.videos_count || 0) + 1 });
        const subs = await base44.entities.Subscription.filter({ channel_id: myChannel.id });
        if (subs?.length) {
          await Promise.all(subs.slice(0, 50).map((sub) =>
            base44.entities.Notification.create({
              type: "new_video", title: "New video", message: `uploaded: ${newVideo.title}`,
              thumbnail_url: thumbUrl, action_url: `/Watch?v=${newVideo.id}`,
              source_channel_id: myChannel.id, source_channel_name: myChannel.name,
              source_channel_avatar: myChannel.avatar_url, video_id: newVideo.id, created_by: sub.created_by,
            })
          ));
        }
      }
    },
    onSuccess: () => navigate(createPageUrl("Home")),
    onError: (e) => { setError(e.message || "Post failed"); setPosting(false); },
  });

  // Sticker interactions
  const addSticker = (emoji) => {
    setStickers((s) => [...s, { id: Date.now(), emoji, x: 360, y: 640, size: 120 }]);
    setShowChars(false);
  };

  const canvasCoords = (e) => {
    const c = canvasRef.current;
    const rect = c.getBoundingClientRect();
    const sx = c.width / rect.width;
    const sy = c.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const onPointerDown = (e) => {
    if (recording || recordedUrl) return;
    const { x, y } = canvasCoords(e);
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i];
      if (Math.hypot(s.x - x, s.y - y) < s.size / 2) {
        dragRef.current = { id: s.id, offX: s.x - x, offY: s.y - y };
        e.currentTarget.setPointerCapture?.(e.pointerId);
        return;
      }
    }
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const { x, y } = canvasCoords(e);
    setStickers((arr) => arr.map((s) => (s.id === dragRef.current.id ? { ...s, x: x + dragRef.current.offX, y: y + dragRef.current.offY } : s)));
  };
  const onPointerUp = () => { dragRef.current = null; };

  const ringPct = Math.min(elapsed / MAX_SECONDS, 1);

  return (
    <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center overflow-hidden">
      {/* hidden source video */}
      <video ref={videoRef} playsInline muted className="hidden" />

      {/* canvas / preview */}
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="w-full h-full object-cover touch-none"
        style={{ aspectRatio: "9/16", maxHeight: "100vh", maxWidth: "calc(100vh * 9/16)" }}
      />

      {/* top bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-20">
        <button onClick={() => navigate(createPageUrl("Home"))} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
          <X className="w-5 h-5" />
        </button>
        <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur text-white text-sm font-medium">
          {recording ? `${elapsed.toFixed(1)}s / ${MAX_SECONDS}s` : "B Near Me · Camera"}
        </div>
        <button
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          disabled={recording || !!recordedUrl}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white disabled:opacity-40"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* error */}
      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-6 bg-black/80">
          <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
          <p className="text-white font-medium mb-1">Camera unavailable</p>
          <p className="text-white/60 text-sm mb-5 max-w-xs">{error}</p>
          <button onClick={startCamera} className="px-5 py-2 rounded-full bg-white text-black font-semibold mb-2">Retry</button>
          <button onClick={() => navigate(createPageUrl("Upload"))} className="px-5 py-2 rounded-full bg-white/10 text-white text-sm flex items-center gap-2">
            <UploadIcon className="w-4 h-4" /> Upload from device
          </button>
        </div>
      )}

      {/* loading */}
      {!ready && !error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center text-white/70">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {/* recorded preview overlay */}
      {recordedUrl && (
        <video src={recordedUrl} autoPlay loop playsInline className="absolute inset-0 z-10 w-full h-full object-cover" style={{ maxHeight: "100vh", maxWidth: "calc(100vh * 9/16)", margin: "auto" }} />
      )}

      {/* bottom controls */}
      {!recordedUrl && (
        <div className="absolute bottom-0 inset-x-0 z-20 pb-6 pt-3 bg-gradient-to-t from-black/70 to-transparent">
          {/* filter rail */}
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
            {FILTER_ORDER.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize transition ${
                  filter === f ? "bg-white text-black" : "bg-white/10 text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-around px-6">
            <button onClick={() => setShowChars((s) => !s)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white">
              <Sticker className="w-6 h-6" />
            </button>

            {/* record button */}
            <button onClick={recording ? stopRecording : startRecording} disabled={!ready} className="relative w-20 h-20 disabled:opacity-40">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="#ec4899" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 36} strokeDashoffset={2 * Math.PI * 36 * (1 - ringPct)} />
              </svg>
              <span className={`absolute inset-2 rounded-full flex items-center justify-center transition ${recording ? "bg-red-500" : "bg-white"}`}>
                    {recording && <span className="w-5 h-5 rounded-[3px] bg-white" />}
              </span>
            </button>

            <button onClick={() => navigate(createPageUrl("Upload"))} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white">
              <ImagePlus className="w-6 h-6" />
            </button>
          </div>

          {/* character picker */}
          {showChars && (
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {CHARACTERS.map((c) => (
                  <button key={c} onClick={() => addSticker(c)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-2xl flex-shrink-0">
                    {c}
                  </button>
                ))}
              </div>
              <p className="text-white/50 text-xs mt-2 text-center">Tap a character, then drag to place. Tap a placed sticker to remove.</p>
            </div>
          )}
        </div>
      )}

      {/* post review controls */}
      {recordedUrl && (
        <div className="absolute bottom-0 inset-x-0 z-20 p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent">
          <button onClick={retake} disabled={posting} className="px-6 py-3 rounded-full bg-white/10 text-white font-semibold backdrop-blur">
            Retake
          </button>
          <button onClick={() => postMutation.mutate()} disabled={posting} className="px-8 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-semibold flex items-center gap-2">
            {posting ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : <><Check className="w-4 h-4" /> Post to feed</>}
          </button>
        </div>
      )}
    </div>
  );
}