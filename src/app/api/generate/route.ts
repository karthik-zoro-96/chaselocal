import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { DEFAULT_CURRENCY, formatMoney } from '@/lib/currency';
import { chat, ModelError } from '@/lib/model';
import { rateLimit } from '@/lib/rate-limit';

const SYSTEM_PROMPT = `You are a professional assistant that writes follow-up messages for freelancers chasing overdue invoices.
Write exactly 3 short email drafts labeled:
1. Polite — a friendly check-in that assumes it was an oversight
2. Firm — state the due date and that it is now N days overdue (when both are known), then ask a direct question such as "When can I expect payment?"
3. Final Notice — state the amount, the due date and how many days overdue it is, say this is the last reminder, and ask for payment or a reply with a payment date

Rules:
- Write like a real person, in plain and specific sentences
- Never use stock phrases such as "at your earliest convenience", "I hope this email finds you well", "kindly", "please do not hesitate", or "thank you in advance"
- Never use the word "prompt" or thank the client for promptness; end the body on the question or request itself
- Write the due date exactly as given (e.g. "October 8, 2026")
- Write the invoice number as "invoice #NUMBER" when it is only digits, otherwise exactly as given
- Start each draft with a line "Subject: ..." that names the invoice number if given
- Keep each draft under 120 words
- Be professional, not aggressive or threatening
- If the client is a person, greet them by first name (e.g. "Hi Aaron,"); if it's a company, greet the company by name
- End with a short sign-off followed by the exact placeholder [Your Name] on its own line, and no other placeholders
- Reference the amount and due date only if provided, writing the amount exactly as given, currency included
- Do not invent invoice numbers, payment deadlines, late fees, or any facts not given
- Output only the 3 drafts, clearly labeled`;

function readableDate(value: unknown) {
  if (typeof value !== 'string' || !value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : format(date, 'MMMM d, yyyy');
}

export async function POST(req: Request) {
  const limited = rateLimit(req);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

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
    } = body;

    if (!clientName || !amount) {
      return NextResponse.json(
        { error: 'Client name and amount are required' },
        { status: 400 }
      );
    }

    const userPrompt = `Client: ${clientName}
Amount: ${formatMoney(String(amount), currency || DEFAULT_CURRENCY)}
Due date: ${readableDate(dueDate) || 'not specified'}
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
