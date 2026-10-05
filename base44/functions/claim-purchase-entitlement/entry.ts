import { createClientFromRequest } from "npm:@base44/sdk";

const tierForProduct = (productId: string) => {
  if (productId === "plus") return "gold";
  if (productId === "pro") return "pro";
  return null;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const base44 = createClientFromRequest(req);
  let user;
  try {
    user = await base44.auth.me();
  } catch {
    return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401 });
  }

  const email = String(user?.email || "").trim().toLowerCase();
  if (!email) {
    return new Response(JSON.stringify({ error: "Authenticated email required" }), { status: 400 });
  }

  const db = base44.asServiceRole;
  const purchases = await db.entities.Base44Purchase.filter({
    buyerEmail: email,
    status: "paid",
  });
  const eligible = (purchases ?? [])
    .map((purchase: any) => ({ purchase, tier: tierForProduct(purchase.productId) }))
    .filter((entry: any) => entry.tier);

  if (!eligible.length) {
    return new Response(JSON.stringify({ claimed: false, tier: "free" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rank: Record<string, number> = { gold: 1, pro: 2 };
  const best = eligible.sort((a: any, b: any) => rank[b.tier] - rank[a.tier])[0];

  const channels = await db.entities.Channel.filter({ created_by: email });
  if (!channels?.length) {
    return new Response(JSON.stringify({
      claimed: false,
      tier: best.tier,
      reason: "channel_required",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  for (const channel of channels) {
    await db.entities.Channel.update(channel.id, { tier: best.tier });
  }

  return new Response(JSON.stringify({
    claimed: true,
    tier: best.tier,
    channelCount: channels.length,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
