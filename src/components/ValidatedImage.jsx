import React, { useState, useEffect } from "react";

// ValidatedImage — only renders an image if the URL loads successfully.
// If the image fails, shows a branded gradient placeholder instead of a broken icon.
// Use this anywhere a thumbnail, avatar, or poster image appears.

export default function ValidatedImage({ src, alt, className, fallback }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    const img = new Image();
    img.onload = () => setStatus("ok");
    img.onerror = () => setStatus("error");
    img.src = src;
  }, [src]);

  if (status === "error" || !src) {
    return (
      fallback || (
        <div className={`bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center ${className}`}>
          <span className="text-gray-600 text-[10px] font-medium">No preview</span>
        </div>
      )
    );
  }

  if (status === "loading") {
    return <div className={`bg-white/5 animate-pulse ${className}`} />;
  }

  return <img src={src} alt={alt} className={className} />;
}