import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users, BarChart3, Handshake, Package, Mail } from "lucide-react";
import AudienceChart from "./AudienceChart";

const sectionIcons = {
  profile: User,
  audience: Users,
  platform: BarChart3,
  collaboration: Handshake,
  packages: Package,
  contact: Mail,
};

const sectionColors = {
  profile: "from-pink-500 to-fuchsia-600",
  audience: "from-fuchsia-500 to-purple-600",
  platform: "from-purple-500 to-indigo-600",
  collaboration: "from-rose-500 to-pink-600",
  packages: "from-fuchsia-500 to-pink-600",
  contact: "from-indigo-500 to-purple-600",
};

export default function MediaKitResult({ result }) {
  if (!result) return null;

  const sections = [
    { key: "profile", title: "Influencer Profile", content: result.profile },
    { key: "audience", title: "Audience Overview", content: result.audience },
    { key: "platform", title: "Platform Statistics", content: result.platform_stats },
    { key: "collaboration", title: "Brand Collaboration Section", content: result.collaboration },
    { key: "packages", title: "Partnership Packages", content: result.packages },
    { key: "contact", title: "Contact Section", content: result.contact },
  ];

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Your{" "}
            <span className="bg-gradient-to-r from-pink-400 to-fuchsia-500 bg-clip-text text-transparent">
              Media Kit
            </span>
          </h2>
          <p className="mt-3 text-gray-400">AI-generated professional media kit</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => {
            const Icon = sectionIcons[section.key];
            const gradient = sectionColors[section.key];
            return (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all rounded-2xl overflow-hidden">
                  <CardHeader className={`bg-gradient-to-r ${gradient} p-4`}>
                    <CardTitle className="flex items-center gap-3 text-white text-lg">
                      <Icon size={22} />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-10"
        >
          <AudienceChart data={result.chart_data} />
        </motion.div>
      </div>
    </section>
  );
}