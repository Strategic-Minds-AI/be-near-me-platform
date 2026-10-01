// Legacy integration shims. Base44 integrations are disabled in the decoupled
// architecture — route AI / uploads / email through your Vercel functions via
// base44.functions.invoke("<name>", payload) instead. These stubs exist only
// so older imports don't break at module load; calling them throws clearly.

function disabled(name) {
  return () => {
    throw new Error(
      `${name} is no longer available via Base44. Use base44.functions.invoke("${name}", ...) to call your Vercel function.`
    );
  };
}

export const InvokeLLM = disabled("InvokeLLM");
export const SendEmail = disabled("SendEmail");
export const SendSMS = disabled("SendSMS");
export const UploadFile = disabled("UploadFile");
export const GenerateImage = disabled("GenerateImage");
export const ExtractDataFromUploadedFile = disabled("ExtractDataFromUploadedFile");