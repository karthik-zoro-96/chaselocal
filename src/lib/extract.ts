import { isCurrency } from './currency';
import { chat } from './model';

const FIELDS = ['clientName', 'amount', 'currency', 'dueDate', 'invoiceNumber', 'workDescription'] as const;

export type ExtractedFields = Record<(typeof FIELDS)[number], string>;

const SYSTEM_PROMPT = `You extract invoice details from text. Return ONLY valid JSON with these fields:
{
  "clientName": "string or empty",
  "amount": "number as string without currency symbol, or empty",
  "currency": "ISO 4217 code of the invoice currency (e.g. USD, EUR, INR, GBP), or empty if unclear",
  "dueDate": "YYYY-MM-DD or empty",
  "invoiceNumber": "string or empty",
  "workDescription": "short description of the work or empty"
}
Do not invent data. If a field is missing, use an empty string.`;

export async function extractFields(text: string): Promise<ExtractedFields> {
  const content = await chat(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Extract from this invoice text:\n\n${text.slice(0, 8000)}` },
    ],
    0.1
  );

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(content.replace(/```(?:json)?\n?/g, '').trim());
  } catch {}

  const fields = Object.fromEntries(
    FIELDS.map((field) => [field, parsed[field] == null ? '' : String(parsed[field]).trim()])
  ) as ExtractedFields;
  fields.currency = fields.currency.toUpperCase();
  if (!isCurrency(fields.currency)) fields.currency = '';
  return fields;
}
