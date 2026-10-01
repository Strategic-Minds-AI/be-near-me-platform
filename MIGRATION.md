# Decoupling Be Near Me from Base44

Base44 is now used **only for hosting and auth**. Data, backend logic, and
integrations route to **Supabase** (Postgres) and **Vercel serverless functions**.

## What changed

`src/api/base44Client.js` is now a facade:

| Surface | Routes to |
|---|---|
| `base44.auth` | Base44 (login, `me()`, logout) — **kept** |
| `base44.users` | Base44 (`inviteUser`) — **kept** |
| `base44.analytics` | Base44 (`track`) — **kept** |
| `base44.entities.*` | **Supabase** (when enabled per entity) or Base44 fallback |
| `base44.functions.invoke()` | **Vercel** `/api/<name>` (when enabled) or Base44 fallback |
| `base44.integrations.*` | **Disabled** — call Vercel functions instead |

Pages keep using `base44.entities.Video.filter(...)` etc. — no page rewrites
needed. The facade routes under the hood.

## Migration steps

### 1. Provision Supabase
1. Create a project at supabase.com.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Enable Row Level Security and add policies (examples at the bottom of the
   schema file). At minimum: public read for public content, owner write for
   personal data, admin full access.
4. Copy your **Project URL** and **anon public key** from Settings → API.

### 2. Point the app at Supabase
Edit `src/lib/config.js`:
```js
export const SUPABASE_URL = "https://yourproject.supabase.co";
export const SUPABASE_ANON_KEY = "eyJ...";
```
Flip entities on one at a time as you confirm their tables work:
```js
export const SUPABASE_ENABLED_ENTITIES = {
  Video: true,
  Channel: true,
  Comment: true,
  // ...
};
```
Or set `SUPABASE_ENABLED_ALL = true` once every table is provisioned.

### 3. Deploy Vercel serverless functions
Each Base44 backend function (`base44/functions/<name>/entry.ts`) becomes a
Vercel API route at `api/<name>.ts` that exports a `POST` handler receiving the
JSON body and returning JSON. Sensitive keys (Vercel AI Gateway, GoDaddy, etc.)
go in Vercel environment variables — never in the frontend.

Create `api/` in the repo root (Vercel detects it automatically). Example:

```ts
// api/uploadFile.ts
export default async function handler(req, res) {
  const { file, filename, content_type } = req.body;
  // ...validate + upload to Supabase Storage / S3 / Cloudinary...
  res.status(200).json({ file_url: "https://..." });
}
```

Then edit `src/lib/config.js`:
```js
export const VERCEL_API_BASE_URL = "https://yourapp.vercel.app/api";
export const VERCEL_FUNCTIONS_ENABLED = true;
```

### 4. Install the Supabase client
The facade imports `@supabase/supabase-js`. Install it:
```
npm install @supabase/supabase-js
```

## Notes
- `base44.integrations.*` is disabled by design. Any AI / upload / email call
  should go through `base44.functions.invoke("<name>", payload)` → your Vercel
  function.
- The Supabase entity wrapper (`src/lib/db.js`) translates the MongoDB-style
  query operators used by the old Base44 SDK (`$in`, `$gte`, `$regex`, `$or`,
  …) to PostgREST filters. `aggregate` is best-effort (fetch + client-side
  group); move heavy aggregates to a Supabase RPC if tables grow large.
- While an entity is not yet flipped to Supabase, it falls back to Base44, so
  the app keeps working during migration.