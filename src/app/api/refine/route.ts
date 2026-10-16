import { NextResponse } from 'next/server';

const TWEAKS: Record<string, string> = {
  'payment-link':
    'Add one short sentence inviting the client to pay via the payment link, using the literal placeholder [Payment link]. Do not invent a URL.',
  concise: 'Make the email noticeably shorter and tighter while keeping every fact and the same tone.',
  direct: 'Make the email more direct and assertive, with a clear call to action, while staying professional and non-threatening.',
};

export async function POST(req: Request) {
  try {
    const { subject, body, tweak, stage } = await req.json();

    const instruction = TWEAKS[tweak];
    if (!instruction || !body) {
      return NextResponse.json({ error: 'Invalid tweak request' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1';
    const model = process.env.MODEL_NAME || 'llama-3.1-8b-instant';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Set OPENAI_API_KEY or GROQ_API_KEY in .env.local' },
        { status: 500 }
      );
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

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Change requested: ${instruction}\n\nSubject: ${subject || ''}\n\n${body}`,
          },
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      console.error(await response.text());
      return NextResponse.json({ error: 'Model API error. Check key and model name.' }, { status: 500 });
    }

    const data = await response.json();
    const draft = data.choices?.[0]?.message?.content?.trim();
    if (!draft) {
      return NextResponse.json({ error: 'The model returned an empty draft.' }, { status: 500 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to refine draft.' }, { status: 500 });
  }
}
