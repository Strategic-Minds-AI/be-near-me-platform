import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";

// ImageUploader — lets users pick images from their device, resizes them
// to max 1024px on a canvas, and returns base64 data URLs. No server upload
// needed (Base44 UploadPublicFile is credit-blocked), so images stay in the
// request payload and are sent directly to the video generator function.
export default function ImageUploader({ images, onChange, max = 6 }) {
  const inputRef = useRef(null);
  const [resizing, setResizing] = useState(false);

  const resizeImage = (file, maxSize = 1024) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFiles = async (files) => {
    setResizing(true);
    try {
      const fileArr = Array.from(files).slice(0, max - images.length);
      const resized = await Promise.all(fileArr.map((f) => resizeImage(f)));
      onChange([...images, ...resized].slice(0, max));
    } catch (err) {
      console.error("Image resize failed:", err);
    } finally {
      setResizing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
        className="hidden"
      />

      <div className="flex flex-wrap gap-2">
        {images.map((img, i) => (
          <div
            key={i}
            className="group relative h-20 w-20 overflow-hidden rounded-xl border border-white/15"
          >
            <img src={img} alt={`upload ${i + 1}`} className="h-full w-full object-cover" />
            <button
              onClick={() => removeImage(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {images.length < max && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={resizing}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 bg-white/[0.03] text-white/50 transition hover:border-fuchsia-500/40 hover:text-fuchsia-300 disabled:opacity-50"
          >
            {resizing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-[9px] font-semibold">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="mt-2 text-[10px] text-[#788399]">
        {images.length > 0
          ? `${images.length} image${images.length > 1 ? "s" : ""} ready — we'll weave them into your video`
          : "Optional: upload photos and we'll build the video around your content"}
      </p>
    </div>
  );
}