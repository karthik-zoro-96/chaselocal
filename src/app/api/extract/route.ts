import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Could not extract enough text from the invoice' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1';
    const model = process.env.MODEL_NAME || 'llama-3.1-8b-instant';

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    const systemPrompt = `You extract invoice details from text. Return ONLY valid JSON with these fields:
{
  "clientName": "string or empty",
  "amount": "number as string without currency symbol, or empty",
  "dueDate": "YYYY-MM-DD or empty",
  "invoiceNumber": "string or empty",
  "workDescription": "short description of the work or empty"
}
Do not invent data. If a field is missing, use an empty string.`;

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
          { role: 'user', content: `Extract from this invoice text:\n\n${text.slice(0, 8000)}` },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '{}';

    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let extracted;
    try {
      extracted = JSON.parse(content);
    } catch {
      extracted = {
        clientName: '',
        amount: '',
        dueDate: '',
        invoiceNumber: '',
        workDescription: '',
      };
    }

    return NextResponse.json({ extracted });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to extract details' }, { status: 500 });
  }
}