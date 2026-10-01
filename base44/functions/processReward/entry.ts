import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { dare_id, truth_id } = body;

    if (dare_id) {
      const dare = await base44.asServiceRole.entities.Dare.get(dare_id);
      if (!dare) return Response.json({ error: 'Dare not found' }, { status: 404 });

      if (dare.initiator_email !== user.email && user.role !== 'admin') {
        return Response.json({ error: 'Only the initiator can record the reward' }, { status: 403 });
      }
      if (!dare.video_verified || dare.status !== 'verified') {
        return Response.json({ error: 'Dare must be independently verified before recording the reward' }, { status: 400 });
      }
      if (dare.reward_paid) {
        return Response.json({ error: 'Reward already recorded' }, { status: 409 });
      }

      await base44.asServiceRole.entities.Dare.update(dare_id, { reward_paid: true });

      waitUntil(
        base44.asServiceRole.entities.Notification.create({
          type: 'milestone',
          title: 'Reward recorded',
          message: `Your verified dare reward of ${dare.infinity_coin_stake} Infinity Coin was recorded in Be Near Me. No blockchain transfer was performed.`,
          action_url: '/Dares',
          read: false,
          created_by: dare.challenger_email,
        }).catch(() => {})
      );

      return Response.json({
        success: true,
        type: 'dare',
        stake: dare.infinity_coin_stake,
        recipient: dare.challenger_email,
        reward_recorded: true,
        transfer_performed: false,
      });
    }

    if (truth_id) {
      const truth = await base44.asServiceRole.entities.Truth.get(truth_id);
      if (!truth) return Response.json({ error: 'Truth not found' }, { status: 404 });

      if (truth.initiator_email !== user.email && user.role !== 'admin') {
        return Response.json({ error: 'Only the initiator can record the reward' }, { status: 403 });
      }
      if (truth.status !== 'revealed') {
        return Response.json({ error: 'Truth must be revealed before recording the reward' }, { status: 400 });
      }
      if (truth.reward_paid) {
        return Response.json({ error: 'Reward already recorded' }, { status: 409 });
      }

      await base44.asServiceRole.entities.Truth.update(truth_id, { reward_paid: true });

      waitUntil(
        base44.asServiceRole.entities.Notification.create({
          type: 'milestone',
          title: 'Reward recorded',
          message: `Your truth reward of ${truth.infinity_coin_stake} Infinity Coin was recorded in Be Near Me. No blockchain transfer was performed.`,
          action_url: '/Truths',
          read: false,
          created_by: truth.responder_email,
        }).catch(() => {})
      );

      return Response.json({
        success: true,
        type: 'truth',
        stake: truth.infinity_coin_stake,
        recipient: truth.responder_email,
        reward_recorded: true,
        transfer_performed: false,
      });
    }

    return Response.json({ error: 'Provide either dare_id or truth_id' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
