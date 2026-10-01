import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BrandLogo from "@/components/BrandLogo";
import { ArrowLeft } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <BrandLogo className="h-10 w-auto mb-8" />
        <h1 className="text-4xl font-bold mb-6">About Be Near Me</h1>
        <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
          <p>
            Be Near Me is a short-form video platform built for creators who want to share,
            grow, and earn. Our full-screen vertical feed lets viewers snap-scroll through an
            endless stream of clips the way they already love — while creators get real tools
            to record, edit, and publish in seconds.
          </p>
          <p>
            We built Be Near Me for two kinds of people: viewers looking for a fresh, fast, and
            fun way to discover video, and creators who want a fairer place to build an audience
            and get paid for their work. What makes us different is the Creator Studio — a full
            dashboard with channel analytics, audience retention graphs, and an AI Video Studio
            that can generate a polished clip from a single prompt.
          </p>
          <p>
            We also let creators mint their own crypto tokens and manage wallets right inside the
            app, so monetization is built in from day one. Be Near Me is built by a small,
            independent team that believes creators deserve a platform that works for them — not
            the other way around.
          </p>
        </div>
      </div>
    </div>
  );
}