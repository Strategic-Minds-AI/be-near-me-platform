import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Film, ImagePlus, Loader2, Upload as UploadIcon, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { uploadFileProxy } from "@/lib/uploadHelper";
import {
  BnmLockedScreen,
  EmptyState,
  Glass,
  GradientButton,
  Pill,
  asItems,
} from "@/components/bnm/LockedShell";

const CATEGORIES = [
  "Kindness",
  "Community",
  "Environment",
  "Animals",
  "People",
  "Local",
];

async function safeCurrentUser() {
  try {
    return await base44.auth.me();
  } catch {
    return null;
  }
}

export default function BnmLockedUpload() {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Community",
    tags: "",
    visibility: "public",
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: safeCurrentUser,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["bnm-upload-channel", user?.email],
    queryFn: async () =>
      asItems(
        await base44.entities.Channel.filter(
          { created_by: user.email },
          { sort: "-created_date", limit: 1 }
        )
      ),
    enabled: Boolean(user?.email),
  });

  const channel = channels[0];

  const chooseVideo = useCallback((file) => {
    if (!file) return;
    if (!String(file.type || "").startsWith("video/")) {
      setError("Choose a valid video file.");
      return;
    }
    setVideoFile(file);
    setForm((current) => ({
      ...current,
      title: current.title || file.name.replace(/\.[^/.]+$/, ""),
    }));
    setError("");
  }, []);

  const chooseThumbnail = useCallback((file) => {
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setError("Choose a valid image file.");
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setError("");
  }, []);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!videoFile || !user?.email || !channel?.id) {
        throw new Error("Video, account, and creator channel are required.");
      }

      setProgress(10);
      const videoUrl = await uploadFileProxy(videoFile);
      setProgress(50);

      let thumbnailUrl = "";
      if (thumbnailFile) {
        thumbnailUrl = await uploadFileProxy(thumbnailFile);
      }
      setProgress(70);

      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8);

      const newVideo = await base44.entities.Video.create({
        title: form.title.trim(),
        description: form.description.trim(),
        url: videoUrl,
        thumbnail_url: thumbnailUrl,
        category: form.category.toLowerCase(),
        tags,
        visibility: form.visibility,
        monetized: false,
        processing_status: "done",
        channel_id: channel.id,
        channel_name: channel.name || user.full_name,
        channel_avatar: channel.avatar_url || "",
        views: 0,
        likes: 0,
        dislikes: 0,
        comments_count: 0,
        published_at: new Date().toISOString(),
      });

      const subscribers = asItems(
        await base44.entities.Subscription.filter(
          { channel_id: channel.id },
          { limit: 50 }
        )
      );

      if (subscribers.length) {
        await Promise.all(
          subscribers.slice(0, 50).map((subscriber) =>
            base44.entities.Notification.create({
              type: "new_video",
              title: "New video",
              message: "A creator you follow posted a new video.",
              thumbnail_url: thumbnailUrl,
              action_url: "/watch?v=" + newVideo.id,
              source_channel_id: channel.id,
              source_channel_name: channel.name,
              source_channel_avatar: channel.avatar_url,
              video_id: newVideo.id,
              created_by: subscriber.created_by,
            })
          )
        );
      }

      await base44.entities.Channel.update(channel.id, {
        videos_count: Number(channel.videos_count || 0) + 1,
      });

      setProgress(100);
      return newVideo;
    },
    onSuccess: (newVideo) => {
      navigate("/watch?v=" + encodeURIComponent(newVideo.id));
    },
    onError: (uploadError) => {
      setError(uploadError?.message || "Upload failed.");
      setProgress(0);
    },
  });

  if (!user) {
    return (
      <BnmLockedScreen activeSection="Creators">
        <div className="px-3 pt-6">
          <EmptyState
            title="Sign in to upload"
            body="A Be Near Me account is required before you can publish a video."
          />
          <div className="mt-4 text-center">
            <GradientButton
              type="button"
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
            >
              Sign In
            </GradientButton>
          </div>
        </div>
      </BnmLockedScreen>
    );
  }

  if (!channel) {
    return (
      <BnmLockedScreen activeSection="Creators">
        <div className="px-3 pt-6">
          <EmptyState
            title="Create your creator profile first"
            body="Your uploads are attached to your Be Near Me creator channel."
          />
          <div className="mt-4 text-center">
            <Link to="/create-channel">
              <GradientButton>Create Channel</GradientButton>
            </Link>
          </div>
        </div>
      </BnmLockedScreen>
    );
  }

  return (
    <BnmLockedScreen activeSection="Creators">
      <div className="px-3 pt-3">
        <Glass className="p-4">
          <div className="flex items-center gap-2">
            <Pill active>
              <UploadIcon className="h-3.5 w-3.5" />
              Upload
            </Pill>
            <span className="text-[10px] text-[#8fa0c4]">
              Publish real creator content
            </span>
          </div>
          <h1 className="mt-3 text-[24px] font-black tracking-[-0.04em]">
            Upload a Video
          </h1>
        </Glass>

        {!videoFile ? (
          <label
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              chooseVideo(event.dataTransfer.files?.[0]);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            className={
              "mt-3 grid min-h-[390px] cursor-pointer place-items-center rounded-[24px] border-2 border-dashed px-6 text-center transition " +
              (dragging
                ? "border-[#a85cff] bg-[#8b52ff]/10"
                : "border-[#35517c] bg-[#071529]")
            }
          >
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => chooseVideo(event.target.files?.[0])}
            />
            <div>
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-[22px] bg-gradient-to-br from-[#26c8ff] via-[#8553ff] to-[#ff38aa]">
                <UploadIcon className="h-9 w-9 text-white" />
              </div>
              <h2 className="mt-5 text-xl font-black text-white">
                Choose or drop a video
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#8fa0c4]">
                Vertical video works best in the Be Near Me feed.
              </p>
            </div>
          </label>
        ) : (
          <div className="mt-3 space-y-3">
            <Glass className="flex items-center gap-3 p-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] bg-[#132443]">
                <Film className="h-6 w-6 text-[#9f83ff]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-white">
                  {videoFile.name}
                </p>
                <p className="text-[10px] text-[#8295b8]">
                  {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVideoFile(null);
                  setProgress(0);
                }}
                className="grid h-9 w-9 place-items-center rounded-full border border-[#35517c]"
              >
                <X className="h-4 w-4" />
              </button>
            </Glass>

            <Glass className="space-y-3 p-3">
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value.slice(0, 100) }))
                }
                placeholder="Video title"
                className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
              />

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value.slice(0, 1000),
                  }))
                }
                rows={4}
                placeholder="Tell people what is happening…"
                className="w-full resize-none rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
              />

              <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
                {CATEGORIES.map((category) => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => setForm((current) => ({ ...current, category }))}
                  >
                    <Pill active={form.category === category}>{category}</Pill>
                  </button>
                ))}
              </div>

              <input
                value={form.tags}
                onChange={(event) =>
                  setForm((current) => ({ ...current, tags: event.target.value.slice(0, 180) }))
                }
                placeholder="Tags, comma separated"
                className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
              />

              <select
                value={form.visibility}
                onChange={(event) =>
                  setForm((current) => ({ ...current, visibility: event.target.value }))
                }
                className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold text-[#9fb0cf]">
                  Thumbnail
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => chooseThumbnail(event.target.files?.[0])}
                />
                <div className="relative aspect-video overflow-hidden rounded-[16px] border border-[#35517c] bg-[#0a1832]">
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <ImagePlus className="h-8 w-8 text-[#7d8fb4]" />
                    </div>
                  )}
                </div>
              </label>

              {progress > 0 ? (
                <div>
                  <div className="mb-1 flex justify-between text-[10px] text-[#91a2c5]">
                    <span>{progress === 100 ? "Complete" : "Uploading"}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#142440]">
                    <div
                      className="h-full bg-gradient-to-r from-[#26c8ff] via-[#8553ff] to-[#ff38aa]"
                      style={{ width: progress + "%" }}
                    />
                  </div>
                </div>
              ) : null}

              {error ? (
                <p className="rounded-[12px] border border-red-400/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                  {error}
                </p>
              ) : null}

              <GradientButton
                type="button"
                className="flex w-full items-center justify-center gap-2"
                disabled={
                  !videoFile ||
                  !form.title.trim() ||
                  uploadMutation.isPending
                }
                onClick={() => uploadMutation.mutate()}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing
                  </>
                ) : (
                  "Publish to Be Near Me"
                )}
              </GradientButton>
            </Glass>
          </div>
        )}
      </div>
    </BnmLockedScreen>
  );
}
