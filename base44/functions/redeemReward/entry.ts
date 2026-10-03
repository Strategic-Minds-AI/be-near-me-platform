import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";
import { getServerReward } from "../../shared/bnmRewardCatalog.ts";

const items = (value: any) => Array.isArray(value) ? value : value?.items || [];

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({})) || {};
    const rewardId = String(body.reward_id || "");
    const deliveryMethod = String(body.delivery_method || "");
    const idempotencyKey = String(body.idempotency_key || "");

    if (!rewardId || !idempotencyKey) return Response.json({ success: false, error: "reward_id and idempotency_key are required" }, { status: 400 });
    if (!["ship", "pickup"].includes(deliveryMethod)) return Response.json({ success: false, error: "Invalid delivery method" }, { status: 400 });

    const reward = getServerReward(rewardId);
    if (!reward) return Response.json({ success: false, error: "Unknown reward" }, { status: 404 });
    if (reward.requiresVerifiedPartner) {
      return Response.json({ success: false, error: "This reward requires a verified partner before redemption" }, { status: 409 });
    }

    const existingResult = await base44.entities.RewardRedemption.filter({ idempotency_key: idempotencyKey }, { limit: 1 });
    const existing = items(existingResult)[0];
    if (existing) {
      return Response.json({ success: existing.status === "completed", idempotent: true, redemption: existing });
    }

    const channelResult = await base44.entities.Channel.filter({ created_by: user.email }, { limit: 1 });
    const channel = items(channelResult)[0];
    if (!channel) return Response.json({ success: false, error: "Create a channel before redeeming rewards" }, { status: 409 });

    const currentCredits = Math.max(0, Math.trunc(Number(channel.credits || 0)));
    if (currentCredits < reward.points) {
      return Response.json({ success: false, error: "Insufficient kindness points" }, { status: 409 });
    }

    const redemption = await base44.entities.RewardRedemption.create({
      idempotency_key: idempotencyKey,
      reward_id: rewardId,
      reward_name: reward.name,
      points_debited: reward.points,
      delivery_method: deliveryMethod,
      status: "pending",
      channel_id: channel.id,
      user_email: user.email,
      fulfillment_state: "pending_verification",
    });

    try {
      await base44.entities.Channel.update(channel.id, { credits: currentCredits - reward.points });
      await base44.entities.RewardRedemption.update(redemption.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    } catch (error) {
      await base44.entities.RewardRedemption.update(redemption.id, {
        status: "failed",
        failure_reason: String(error?.message || error),
      }).catch(() => {});
      throw error;
    }

    return Response.json({
      success: true,
      redemption_id: redemption.id,
      reward_id: rewardId,
      points_debited: reward.points,
      remaining_points: currentCredits - reward.points,
      fulfillment_state: "pending_verification",
    });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || "Reward redemption failed" }, { status: 500 });
  }
}
