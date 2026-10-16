import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      clientName,
      amount,
      dueDate,
      daysOverdue,
      workDescription,
      previousMessage,
      invoiceNumber,
    } = body;

    if (!clientName || !amount) {
      return NextResponse.json(
        { error: 'Client name and amount are required' },
        { status: 400 }
      );
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

    const systemPrompt = `You are a professional assistant that writes follow-up messages for freelancers chasing overdue invoices.
Write exactly 3 short email drafts labeled:
1. Polite
2. Firm
3. Final Notice

Rules:
- Keep each draft under 120 words
- Be professional, not aggressive or threatening
- Use the full client name
- Reference the amount and due date only if provided
- Do not invent invoice numbers, payment deadlines, late fees, or any facts not given
- Output only the 3 drafts, clearly labeled`;

    const userPrompt = `Client: ${clientName}
Amount: $${amount}
Due date: ${dueDate || 'not specified'}
Days overdue: ${daysOverdue || 'unknown'}
Invoice number: ${invoiceNumber || 'not specified'}
Work: ${workDescription || 'professional services'}
Previous message: ${previousMessage || 'none'}

Write the 3 follow-up drafts.`;

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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(err);
      return NextResponse.json(
        { error: 'Model API error. Check key and model name.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const drafts = data.choices?.[0]?.message?.content || 'No response';

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to generate drafts.' },
      { status: 500 }
    );
  }
}