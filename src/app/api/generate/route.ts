import { NextResponse } from 'next/server';
import { DEFAULT_CURRENCY, formatMoney } from '@/lib/currency';
import { chat, ModelError } from '@/lib/model';
import { rateLimit } from '@/lib/rate-limit';

const SYSTEM_PROMPT = `You are a professional assistant that writes follow-up messages for freelancers chasing overdue invoices.
Write exactly 3 short email drafts labeled:
1. Polite
2. Firm
3. Final Notice

Rules:
- Keep each draft under 120 words
- Be professional, not aggressive or threatening
- Use the full client name
- Reference the amount and due date only if provided, writing the amount exactly as given, currency included
- Do not invent invoice numbers, payment deadlines, late fees, or any facts not given
- Output only the 3 drafts, clearly labeled`;

export async function POST(req: Request) {
  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    const {
      clientName,
      amount,
      currency,
      dueDate,
      daysOverdue,
      workDescription,
      previousMessage,
      invoiceNumber,
    } = await req.json();

    if (!clientName || !amount) {
      return NextResponse.json(
        { error: 'Client name and amount are required' },
        { status: 400 }
      );
    }

    const userPrompt = `Client: ${clientName}
Amount: ${formatMoney(String(amount), currency || DEFAULT_CURRENCY)}
Due date: ${dueDate || 'not specified'}
Days overdue: ${daysOverdue || 'unknown'}
Invoice number: ${invoiceNumber || 'not specified'}
Work: ${workDescription || 'professional services'}
Previous message: ${previousMessage || 'none'}

Write the 3 follow-up drafts.`;

    const drafts = await chat(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      0.7
    );

    if (!drafts) {
      return NextResponse.json({ error: 'The model returned no drafts. Try again.' }, { status: 500 });
    }

    return NextResponse.json({ drafts });
  } catch (error) {
    console.error(error);
    const message = error instanceof ModelError ? error.message : 'Failed to generate drafts.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
