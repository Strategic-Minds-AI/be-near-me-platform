import { useState } from "react";
import { Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  BnmLockedScreen,
  Glass,
  GradientButton,
  Pill,
} from "@/components/bnm/LockedShell";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    try {
      await base44.entities.Lead.create({
        form_type: "contact",
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      setForm({ name: "", email: "", message: "" });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <BnmLockedScreen>
      <div className="px-3 pt-3">
        <Glass className="p-4">
          <Pill active>Support</Pill>
          <h1 className="mt-3 text-[24px] font-black tracking-[-0.04em]">
            Contact Be Near Me
          </h1>
          <p className="mt-1 text-sm leading-6 text-[#8fa0c4]">
            Send a question, support request, or partnership message.
          </p>
        </Glass>

        <Glass className="mt-3 p-4">
          <form onSubmit={submit} className="space-y-3">
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value.slice(0, 100),
                }))
              }
              required
              placeholder="Name"
              className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value.slice(0, 160),
                }))
              }
              required
              placeholder="Email"
              className="w-full rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
            />
            <textarea
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  message: event.target.value.slice(0, 2000),
                }))
              }
              required
              rows={6}
              placeholder="How can we help?"
              className="w-full resize-none rounded-[14px] border border-[#35517c] bg-[#0a1832] px-3 py-3 text-sm text-white outline-none placeholder:text-[#7184a8]"
            />

            {status === "sent" ? (
              <p className="rounded-[12px] border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-300">
                Your message was submitted.
              </p>
            ) : null}
            {status === "error" ? (
              <p className="rounded-[12px] border border-red-400/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                The message could not be submitted. Please try again.
              </p>
            ) : null}

            <GradientButton
              type="submit"
              className="flex w-full items-center justify-center gap-2"
              disabled={status === "sending"}
            >
              <Send className="h-4 w-4" />
              {status === "sending" ? "Sending" : "Send Message"}
            </GradientButton>
          </form>
        </Glass>
      </div>
    </BnmLockedScreen>
  );
}
