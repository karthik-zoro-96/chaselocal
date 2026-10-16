import { NextResponse } from 'next/server';
import { chat, ModelError } from '@/lib/model';
import { rateLimit } from '@/lib/rate-limit';

const TWEAKS: Record<string, string> = {
  'payment-link':
    'Add one short sentence inviting the client to pay via the payment link, using the literal placeholder [Payment link]. Do not invent a URL.',
  concise: 'Make the email noticeably shorter and tighter while keeping every fact and the same tone.',
  direct: 'Make the email more direct and assertive, with a clear call to action, while staying professional and non-threatening.',
};

export async function POST(req: Request) {
  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    const { subject, body, tweak, stage } = await req.json();

    const instruction = TWEAKS[tweak];
    if (!instruction || !body) {
      return NextResponse.json({ error: 'Invalid tweak request' }, { status: 400 });
    }

    const systemPrompt = `You revise a single follow-up email that a freelancer is sending about an overdue invoice.
Rules:
- Apply only the requested change
- Keep it a "${stage || 'follow-up'}" email
- Do not invent invoice numbers, amounts, dates, deadlines, late fees, or any facts not already in the email
- Keep placeholders like [Your Name] as they are
- Output exactly:
Subject: <subject line>

<email body>`;

    const draft = await chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Change requested: ${instruction}\n\nSubject: ${subject || ''}\n\n${body}` },
      ],
      0.5
    );

    if (!draft) {
      return NextResponse.json({ error: 'The model returned an empty draft.' }, { status: 500 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error(error);
    const message = error instanceof ModelError ? error.message : 'Failed to refine draft.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
