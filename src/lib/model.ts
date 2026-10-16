type Message = { role: 'system' | 'user'; content: string };

export class ModelError extends Error {}

export async function chat(messages: Message[], temperature: number) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1';
  const model = process.env.MODEL_NAME || 'llama-3.1-8b-instant';

  if (!apiKey) {
    throw new ModelError('Missing API key. Set OPENAI_API_KEY or GROQ_API_KEY in .env.local');
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature }),
  });

  if (!response.ok) {
    console.error(await response.text());
    throw new ModelError(
      response.status === 429
        ? 'The model is busy right now. Try again in a minute.'
        : 'Model API error. Check key and model name.'
    );
  }

  const data = await response.json();
  return (data.choices?.[0]?.message?.content ?? '').trim() as string;
}
