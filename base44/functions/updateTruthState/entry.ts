import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

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
      const responderEmail = cleanEmail(body.responder_email);
      const truthPrompt = cleanText(body.truth_prompt, 2000);
      const stake = boundedNumber(body.infinity_coin_stake ?? 0, 0, 1_000_000);
      const expiresDays = boundedNumber(body.expires_days ?? 7, 1, 30);

      if (!responderEmail || !truthPrompt || stake === null || expiresDays === null) {
        return Response.json({ error: 'Invalid truth input' }, { status: 400 });
      }

      const expiresAt = new Date(Date.now() + expiresDays * 86_400_000).toISOString();
      const truth = await base44.asServiceRole.entities.Truth.create({
        initiator_email: user.email,
        responder_email: responderEmail,
        truth_prompt: truthPrompt,
        infinity_coin_stake: stake,
        status: 'pending',
        reward_paid: false,
        expires_at: expiresAt,
      });

      return Response.json({ success: true, truth_id: truth.id, status: truth.status ?? 'pending' });
    }

    const truthId = cleanText(body.truth_id, 200);
    if (!truthId) return Response.json({ error: 'truth_id is required' }, { status: 400 });

    const truth = await base44.asServiceRole.entities.Truth.get(truthId);
    if (!truth) return Response.json({ error: 'Truth not found' }, { status: 404 });

    const isAdmin = user.role === 'admin';
    const isInitiator = truth.initiator_email === user.email;
    const isResponder = truth.responder_email === user.email;
    if (!isAdmin && !isInitiator && !isResponder) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let update: Record<string, unknown>;

    if (action === 'accept' || action === 'decline') {
      if (!isAdmin && !isResponder) return Response.json({ error: 'Only the responder can respond' }, { status: 403 });
      if (truth.status !== 'pending') return Response.json({ error: 'Truth is not pending' }, { status: 409 });
      update = { status: action === 'accept' ? 'accepted' : 'declined' };
    } else if (action === 'reveal') {
      if (!isAdmin && !isResponder) return Response.json({ error: 'Only the responder can reveal' }, { status: 403 });
      if (truth.status !== 'accepted') return Response.json({ error: 'Truth is not accepted' }, { status: 409 });
      const responseText = cleanText(body.response_text, 5000);
      if (!responseText) return Response.json({ error: 'response_text is required' }, { status: 400 });
      update = { status: 'revealed', response_text: responseText, revealed_at: new Date().toISOString() };
    } else {
      return Response.json({ error: 'Unsupported truth action' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.Truth.update(truthId, update);
    return Response.json({ success: true, truth_id: truthId, status: updated.status ?? update.status });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
