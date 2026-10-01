import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BrandLogo from "@/components/BrandLogo";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await base44.entities.Lead.create({
        form_type: "contact",
        name,
        email,
        message,
      });
      setSubmitted(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError("Something went wrong. Please email us directly at hello@benearme.io");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <BrandLogo className="h-10 w-auto mb-8" />
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-400 mb-8">
          Have a question, partnership idea, or just want to say hi? We'd love to hear from you.
        </p>
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-gray-300">
            <Mail className="w-5 h-5 text-pink-500" />
            <a href="mailto:hello@benearme.io" className="hover:text-white">
              hello@benearme.io
            </a>
          </div>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-white/5 rounded-2xl p-6 border border-white/10"
          >
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {submitted && (
              <p className="text-green-400 text-sm">Thanks! We'll get back to you soon.</p>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white rounded-full"
            >
              <Send className="w-4 h-4" /> {submitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}