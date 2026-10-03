import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Camera, ImagePlus, Loader2, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { uploadFileProxy } from "@/lib/uploadHelper";
import {
  Avatar,
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

export default function BnmLockedSettings() {
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [message, setMessage] = useState("");
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
    queryKey: ["bnm-settings-channel", user?.email],
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

  useEffect(() => {
    if (!channel) return;
    setForm({
      name: channel.name || "",
      handle: channel.handle || "",
      description: channel.description || "",
    });
    setAvatarPreview(channel.avatar_url || "");
    setBannerPreview(channel.banner_url || "");
  }, [channel?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!channel?.id) throw new Error("Creator profile not found.");

      let avatarUrl = channel.avatar_url || "";
      let bannerUrl = channel.banner_url || "";

      if (avatarFile) avatarUrl = await uploadFileProxy(avatarFile);
      if (bannerFile) bannerUrl = await uploadFileProxy(bannerFile);

      const name = form.name.trim();
      const handle = form.handle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");

      if (!name || !handle) throw new Error("Name and handle are required.");

      await base44.entities.Channel.update(channel.id, {
        name,
        handle,
        description: form.description.trim(),
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
      });
    },
    onSuccess: async () => {
      setMessage("Saved");
      await queryClient.invalidateQueries({
        queryKey: ["bnm-settings-channel", user?.email],
      });
      await queryClient.invalidateQueries({
        queryKey: ["bnm-profile-my-channel", user?.email],
      });
    },
    onError: (error) => {
      setMessage(error?.message || "Could not save changes.");
    },
  });

  if (!user) {
    return (
      <BnmLockedScreen activeSection="Creators">
        <div className="px-3 pt-6">
          <EmptyState
            title="Sign in to edit your profile"
            body="Your Be Near Me account is required to manage creator settings."
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
            title="No creator profile yet"
            body="Create your profile before editing creator settings."
          />
          <div className="mt-4 text-center">
            <Link to="/create-channel">
              <GradientButton>Create Profile</GradientButton>
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
          <Pill active>Profile Settings</Pill>
          <h1 className="mt-3 text-[24px] font-black tracking-[-0.04em]">
            Edit Creator Profile
          </h1>
          <p className="mt-1 text-sm leading-6 text-[#8fa0c4]">
            Update the real profile information shown across Be Near Me.
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
                setMessage("");
              }}
            />
            {bannerPreview ? (
              <img src={bannerPreview} alt="" className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[10px] font-bold text-white">
              <ImagePlus className="h-3.5 w-3.5" />
              Change Banner
            </div>
          </label>

          <div className="-mt-10 px-4 pb-4">
            <label className="relative z-10 block w-fit cursor-pointer">
              <Avatar src={avatarPreview} label={form.name || "BN"} size={80} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                  setMessage("");
                }}
              />
              <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full border-2 border-[#08162b] bg-[#8b52ff]">
                <Camera className="h-3.5 w-3.5 text-white" />
              </span>
            </label>

            <div className="mt-4 space-y-3">
              <input
                value={form.name}
                onChange={(event) => {
                  setMessage("");
                  setForm((current) => ({
                    ...current,
                    name: event.target.value.slice(0, 50),
                  }));
                }}
                placeholder="Creator name"
                className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
              />

              <div className="flex items-center rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3">
                <span className="text-sm text-[#7184a8]">@</span>
                <input
                  value={form.handle}
                  onChange={(event) => {
                    setMessage("");
                    setForm((current) => ({
                      ...current,
                      handle: event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "")
                        .slice(0, 30),
                    }));
                  }}
                  placeholder="handle"
                  className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
                />
              </div>

              <textarea
                value={form.description}
                onChange={(event) => {
                  setMessage("");
                  setForm((current) => ({
                    ...current,
                    description: event.target.value.slice(0, 500),
                  }));
                }}
                rows={4}
                placeholder="Creator bio"
                className="w-full resize-none rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
              />

              {message ? (
                <p
                  className={
                    "rounded-[12px] border px-3 py-2 text-[11px] " +
                    (message === "Saved"
                      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                      : "border-red-400/20 bg-red-500/10 text-red-300")
                  }
                >
                  {message}
                </p>
              ) : null}

              <GradientButton
                type="button"
                className="flex w-full items-center justify-center gap-2"
                disabled={
                  !form.name.trim() ||
                  !form.handle.trim() ||
                  saveMutation.isPending
                }
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </GradientButton>
            </div>
          </div>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
