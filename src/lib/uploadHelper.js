import { base44 } from "@/api/base44Client";

// Client-side helper: convert a File object to base64 for the uploadFile backend function.

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a file through the server-side uploadFile proxy.
 * @param {File} file - The browser File object
 * @returns {Promise<string>} The public file URL
 */
export async function uploadFileProxy(file) {
  const base64 = await fileToBase64(file);
  const res = await base44.functions.invoke("uploadFile", {
    file: base64,
    filename: file.name,
    content_type: file.type,
  });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data.file_url;
}