import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CATEGORIES = new Set([
  'kindness',
  'fitness',
  'creativity',
  'community',
  'environment',
  'learning',
  'bravery',
  'other',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function boundedNumber(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function cleanText(value: unknown, maxLength: number) {
  const text = String(value ?? '').trim();
  return text && text.length <= maxLength ? text : null;
}

function cleanEmail(value: unknown) {
  const email = String(value ?? '').trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

export default async function(req: Request) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');

    if (action === 'create') {
      const challengerEmail = cleanEmail(body.challenger_email);
      const challengeText = cleanText(body.challenge_text, 2000);
      const category = CATEGORIES.has(body.category) ? body.category : 'kindness';
      const stake = boundedNumber(body.infinity_coin_stake ?? 0, 0, 1_000_000);
      const expiresDays = boundedNumber(body.expires_days ?? 7, 1, 30);

      if (!challengerEmail || !challengeText || stake === null || expiresDays === null) {
        return Response.json({ error: 'Invalid dare input' }, { status: 400 });
      }

      const expiresAt = new Date(Date.now() + expiresDays * 86_400_000).toISOString();
      const dare = await base44.asServiceRole.entities.Dare.create({
        initiator_email: user.email,
        challenger_email: challengerEmail,
        challenge_text: challengeText,
        category,
        infinity_coin_stake: stake,
        status: 'pending',
        video_verified: false,
        reward_paid: false,
        expires_at: expiresAt,
      });

      return Response.json({ success: true, dare_id: dare.id, status: dare.status ?? 'pending' });
    }

    const dareId = cleanText(body.dare_id, 200);
    if (!dareId) return Response.json({ error: 'dare_id is required' }, { status: 400 });

    const dare = await base44.asServiceRole.entities.Dare.get(dareId);
    if (!dare) return Response.json({ error: 'Dare not found' }, { status: 404 });

    const isAdmin = user.role === 'admin';
    const isInitiator = dare.initiator_email === user.email;
    const isChallenger = dare.challenger_email === user.email;
    if (!isAdmin && !isInitiator && !isChallenger) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let update: Record<string, unknown>;

    if (action === 'accept' || action === 'decline') {
      if (!isAdmin && !isChallenger) return Response.json({ error: 'Only the challenger can respond' }, { status: 403 });
      if (dare.status !== 'pending') return Response.json({ error: 'Dare is not pending' }, { status: 409 });
      update = { status: action === 'accept' ? 'accepted' : 'declined' };
    } else if (action === 'submit_proof') {
      if (!isAdmin && !isChallenger) return Response.json({ error: 'Only the challenger can submit proof' }, { status: 403 });
      if (!['accepted', 'in_progress'].includes(dare.status)) {
        return Response.json({ error: 'Dare is not ready for proof submission' }, { status: 409 });
      }
      const videoUrl = cleanText(body.video_url, 4000);
      if (!videoUrl || !videoUrl.startsWith('https://')) {
        return Response.json({ error: 'A secure proof video URL is required' }, { status: 400 });
      }
      update = { video_url: videoUrl, status: 'submitted', video_verified: false };
    } else {
      return Response.json({ error: 'Unsupported dare action' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.Dare.update(dareId, update);
    return Response.json({ success: true, dare_id: dareId, status: updated.status ?? update.status });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
