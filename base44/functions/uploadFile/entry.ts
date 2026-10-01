import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { sanitizeFilename, checkRateLimit } from "../../shared/aiSecurity.ts";

// uploadFile — server-side proxy for file uploads.
// Accepts base64-encoded file data from the client and uploads via the SDK
// service role. Centralizes uploads so the client never calls Core integrations
// directly, enabling validation, rate limiting, and consistent error handling.
// Files are stored publicly — each gets a permanent public URL.

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_CONTENT_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const rl = checkRateLimit(user.id, "uploadFile");
    if (!rl.allowed) {
      return Response.json(
        { error: `Rate limit exceeded. Try again in ${rl.retryAfter}s.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({})) || {};
    const { file, filename, content_type } = body;

    if (!file || !filename) {
      return Response.json({ error: "file and filename are required" }, { status: 400 });
    }

    const safeType = content_type || "application/octet-stream";
    if (!ALLOWED_CONTENT_TYPES.includes(safeType)) {
      return Response.json({ error: "File type not allowed" }, { status: 400 });
    }

    // Decode base64 (strip data URL prefix if present)
    const base64Data = typeof file === "string" && file.includes(",")
      ? file.split(",")[1]
      : file;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    if (bytes.length > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File too large (max 100MB)" },
        { status: 400 }
      );
    }

    const safeName = sanitizeFilename(filename);
    const blob = new Blob([bytes], { type: safeType });
    const fileObj = new File([blob], safeName, { type: safeType });

    const result = await base44.asServiceRole.integrations.Core.UploadPublicFile({
      file: fileObj,
    });

    return Response.json({ file_url: result.file_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}