import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { queueInfinityCoinActivityReward } from '../../shared/bnmMembershipLedger.ts';

async function settleReward(base44, input) {
  const reward = await queueInfinityCoinActivityReward(base44, {
    userEmail: input.recipientEmail,
    sourceKind: input.sourceKind,
    sourceId: input.sourceId,
    amount: input.amount,
    reason: input.reason,
  });

  if (!reward.eligible) {
    await input.markSettled();
    waitUntil(
      base44.entities.Notification.create({
        type: 'milestone',
        title: 'Activity complete',
        message: 'Your activity is complete. Free membership participates fully but does not earn Infinity Coin.',
        action_url: input.actionUrl,
        read: false,
        created_by: input.recipientEmail,
      }).catch(() => {})
    );
    return {
      success: true,
      eligible_for_infinity_coin: false,
      infinity_coin_amount: 0,
      reward_status: 'settled_without_coin',
    };
  }

  waitUntil(
    base44.entities.Notification.create({
      type: 'milestone',
      title: 'Infinity Coin reward queued',
      message: `${reward.amount} Infinity Coin is recorded for this verified activity and is pending governed mint validation.`,
      action_url: input.actionUrl,
      read: false,
      created_by: input.recipientEmail,
    }).catch(() => {})
  );

  return {
    success: true,
    eligible_for_infinity_coin: true,
    infinity_coin_amount: reward.amount,
    reward_status: reward.status,
    token_ledger_entry_id: reward.ledger?.id || null,
    idempotent: reward.idempotent || false,
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { dare_id, truth_id } = body;

    if (dare_id) {
      const dare = await base44.entities.Dare.get(dare_id);
      if (!dare) return Response.json({ error: 'Dare not found' }, { status: 404 });

      if (dare.initiator_email !== user.email && user.role !== 'admin') {
        return Response.json({ error: 'Only the initiator can settle the reward' }, { status: 403 });
      }
      if (!dare.video_verified || dare.status !== 'verified') {
        return Response.json({ error: 'Dare must be verified before reward settlement' }, { status: 400 });
      }
      if (dare.reward_paid) {
        return Response.json({ success: true, idempotent: true, reward_status: 'already_settled' });
      }

      const result = await settleReward(base44, {
        recipientEmail: dare.challenger_email,
        sourceKind: 'dare',
        sourceId: dare.id,
        amount: dare.infinity_coin_stake,
        reason: 'Verified kindness dare reward',
        actionUrl: '/Dares',
        markSettled: () => base44.entities.Dare.update(dare_id, { reward_paid: true }),
      });

      return Response.json({ ...result, type: 'dare', recipient: dare.challenger_email });
    }

    if (truth_id) {
      const truth = await base44.entities.Truth.get(truth_id);
      if (!truth) return Response.json({ error: 'Truth not found' }, { status: 404 });

      if (truth.initiator_email !== user.email && user.role !== 'admin') {
        return Response.json({ error: 'Only the initiator can settle the reward' }, { status: 403 });
      }
      if (truth.status !== 'revealed') {
        return Response.json({ error: 'Truth must be revealed before reward settlement' }, { status: 400 });
      }
      if (truth.reward_paid) {
        return Response.json({ success: true, idempotent: true, reward_status: 'already_settled' });
      }

      const result = await settleReward(base44, {
        recipientEmail: truth.responder_email,
        sourceKind: 'truth',
        sourceId: truth.id,
        amount: truth.infinity_coin_stake,
        reason: 'Revealed truth activity reward',
        actionUrl: '/Truths',
        markSettled: () => base44.entities.Truth.update(truth_id, { reward_paid: true }),
      });

      return Response.json({ ...result, type: 'truth', recipient: truth.responder_email });
    }

    return Response.json({ error: 'Provide either dare_id or truth_id' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || 'Reward settlement failed' }, { status: 500 });
  }
}
