import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
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

async function safeCurrentUser() {
  try {
    return await base44.auth.me();
  } catch {
    return null;
  }
}

export default function BnmLockedCreateChannel() {
  const navigate = useNavigate();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    handle: "",
    description: "",
  });

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: safeCurrentUser,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["bnm-create-channel-existing", user?.email],
    queryFn: async () =>
      asItems(
        await base44.entities.Channel.filter(
          { created_by: user.email },
          { sort: "-created_date", limit: 1 }
        )
      ),
    enabled: Boolean(user?.email),
  });

  const existing = channels[0];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) throw new Error("Sign in is required.");
      const name = form.name.trim();
      const handle = form.handle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
      if (!name || !handle) throw new Error("Name and handle are required.");

      let avatarUrl = "";
      let bannerUrl = "";

      if (avatarFile) avatarUrl = await uploadFileProxy(avatarFile);
      if (bannerFile) bannerUrl = await uploadFileProxy(bannerFile);

      return base44.entities.Channel.create({
        name,
        handle,
        description: form.description.trim(),
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        subscribers_count: 0,
        videos_count: 0,
        total_views: 0,
        tier: "free",
        credits: 0,
        verified: false,
      });
    },
    onSuccess: () => navigate("/profile"),
    onError: (mutationError) =>
      setError(mutationError?.message || "Could not create your creator profile."),
  });

  if (!user) {
    return (
      <BnmLockedScreen activeSection="Creators">
        <div className="px-3 pt-6">
          <EmptyState
            title="Sign in to create your profile"
            body="A Be Near Me account is required before creating a creator profile."
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

  if (existing) {
    return (
      <BnmLockedScreen activeSection="Creators">
        <div className="px-3 pt-6">
          <EmptyState
            title="Your creator profile already exists"
            body="Manage your current profile instead of creating a duplicate."
          />
          <div className="mt-4 text-center">
            <Link to="/profile">
              <GradientButton>Open Profile</GradientButton>
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
          <Pill active>Creator Setup</Pill>
          <h1 className="mt-3 text-[24px] font-black tracking-[-0.04em]">
            Create Your Profile
          </h1>
          <p className="mt-1 text-sm leading-6 text-[#8fa0c4]">
            Choose how your creator identity appears across Be Near Me.
          </p>
        </Glass>

        <Glass className="mt-3 overflow-hidden">
          <label className="relative block h-36 cursor-pointer bg-[linear-gradient(135deg,#153d67,#172447_55%,#3f183f)]">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setBannerFile(file);
                setBannerPreview(URL.createObjectURL(file));
              }}
            />
            {bannerPreview ? (
              <img src={bannerPreview} alt="" className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[10px] font-bold text-white">
              <ImagePlus className="h-3.5 w-3.5" />
              Banner
            </div>
          </label>

          <div className="-mt-10 px-4 pb-4">
            <label className="relative z-10 block h-20 w-20 cursor-pointer overflow-hidden rounded-full bg-gradient-to-br from-[#30c8ff] via-[#9650ff] to-[#ff3aa9] p-[2px]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                }}
              />
              <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-[#0a1730]">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-[#9e8bff]" />
                )}
              </span>
            </label>

            <div className="mt-4 space-y-3">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value.slice(0, 50),
                  }))
                }
                placeholder="Creator name"
                className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
              />

              <div className="flex items-center rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3">
                <span className="text-sm text-[#7184a8]">@</span>
                <input
                  value={form.handle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      handle: event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "")
                        .slice(0, 30),
                    }))
                  }
                  placeholder="handle"
                  className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
                />
              </div>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value.slice(0, 500),
                  }))
                }
                rows={4}
                placeholder="Tell people what you create or care about…"
                className="w-full resize-none rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
              />

              {error ? (
                <p className="rounded-[12px] border border-red-400/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                  {error}
                </p>
              ) : null}

              <GradientButton
                type="button"
                className="flex w-full items-center justify-center gap-2"
                disabled={
                  !form.name.trim() ||
                  !form.handle.trim() ||
                  createMutation.isPending
                }
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating
                  </>
                ) : (
                  "Create Creator Profile"
                )}
              </GradientButton>
            </div>
          </div>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
