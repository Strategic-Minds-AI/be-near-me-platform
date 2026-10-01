import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';

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

      // Only the initiator can pay the reward
      if (dare.initiator_email !== user.email && user.role !== 'admin') {
        return Response.json({ error: 'Only the initiator can pay the reward' }, { status: 403 });
      }

      if (!dare.video_verified || dare.status !== 'verified') {
        return Response.json({ error: 'Dare must be verified before paying reward' }, { status: 400 });
      }

      if (dare.reward_paid) {
        return Response.json({ error: 'Reward already paid' }, { status: 400 });
      }

      // Mark reward as paid
      await base44.entities.Dare.update(dare_id, { reward_paid: true });

      // Notify the challenger
      waitUntil(
        base44.entities.Notification.create({
          type: 'milestone',
          title: 'You earned Infinity Coin! 🪙',
          message: `Your kindness dare was completed and verified. ${dare.infinity_coin_stake} Infinity Coin is yours!`,
          action_url: '/Dares',
          read: false,
        }).catch(() => {})
      );

      return Response.json({ success: true, type: 'dare', stake: dare.infinity_coin_stake, recipient: dare.challenger_email });
    }

    if (truth_id) {
      const truth = await base44.entities.Truth.get(truth_id);
      if (!truth) return Response.json({ error: 'Truth not found' }, { status: 404 });

      if (truth.initiator_email !== user.email && user.role !== 'admin') {
        return Response.json({ error: 'Only the initiator can pay the reward' }, { status: 403 });
      }

      if (truth.status !== 'revealed') {
        return Response.json({ error: 'Truth must be revealed before paying reward' }, { status: 400 });
      }

      if (truth.reward_paid) {
        return Response.json({ error: 'Reward already paid' }, { status: 400 });
      }

      await base44.entities.Truth.update(truth_id, { reward_paid: true });

      waitUntil(
        base44.entities.Notification.create({
          type: 'milestone',
          title: 'You earned Infinity Coin! 🪙',
          message: `Your truth was revealed with courage. ${truth.infinity_coin_stake} Infinity Coin is yours!`,
          action_url: '/Truths',
          read: false,
        }).catch(() => {})
      );

      return Response.json({ success: true, type: 'truth', stake: truth.infinity_coin_stake, recipient: truth.responder_email });
    }

    return Response.json({ error: 'Provide either dare_id or truth_id' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}