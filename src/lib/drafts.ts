export type Draft = { label: string; subject: string; body: string };

export const STAGES = [
  { label: 'Polite', stage: 'Stage 1: Friendly Follow-up', recommended: 'Day 1–7', dot: 'bg-emerald-500' },
  { label: 'Firm', stage: 'Stage 2: Firm Reminder', recommended: 'Day 8–21', dot: 'bg-amber-500' },
  { label: 'Final Notice', stage: 'Stage 3: Final Notice', recommended: 'Day 22+', dot: 'bg-red-500' },
] as const;

const DRAFT_HEADING =
  /^[\s#*_]*(?:\d+[.)]\s*)?[*_]*\s*(Polite|Firm|Final Notice)\s*(?:draft|email|message)?[\s*_:)\-–—]*$/gim;

const SUBJECT_LINE = /^[*_]*subject[*_]*\s*:\s*(.+)$/im;

function stripEmphasis(text: string) {
  return text.replace(/\*\*\s*(.+?)\s*\*\*/g, '$1').replace(/__\s*(.+?)\s*__/g, '$1');
}

export function splitSubject(text: string): { subject: string; body: string } {
  const plain = stripEmphasis(text);
  const match = plain.match(SUBJECT_LINE);
  if (!match || match.index === undefined) return { subject: '', body: plain.trim() };
  const body = (plain.slice(0, match.index) + plain.slice(match.index + match[0].length)).trim();
  return { subject: match[1].replace(/[*_]+$/, '').trim(), body };
}

function clean(text: string) {
  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n-{3,}\s*$/, '')
    .trim();
}

export function splitDrafts(text: string): Draft[] | null {
  const headings = [...text.matchAll(DRAFT_HEADING)];
  if (headings.length !== 3) return null;

  return headings.map((match, i) => {
    const start = match.index + match[0].length;
    const end = headings[i + 1]?.index ?? text.length;
    return { label: match[1], ...splitSubject(clean(text.slice(start, end))) };
  });
}

export function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export function readTime(text: string) {
  const seconds = Math.max(10, Math.round((wordCount(text) / 200) * 60 / 5) * 5);
  return seconds < 60 ? `~${seconds} sec read` : `~${Math.round(seconds / 60)} min read`;
}

export function recommendedStage(daysOverdue: string) {
  const days = Number(daysOverdue);
  if (!daysOverdue || !Number.isFinite(days) || days <= 0) return null;
  return days <= 7 ? 0 : days <= 21 ? 1 : 2;
}

export function daysSince(isoDate: string) {
  const due = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - due.getTime()) / 86_400_000);
}

const MONTHS = String.raw`(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?`;
const AMOUNT = String.raw`\d[\d,]*(?:\.\d+)?`;
const BASE_HIGHLIGHTS = [
  String.raw`\p{Sc}\s?${AMOUNT}`,
  String.raw`\b\d{1,2}(?:st|nd|rd|th)?\s+(?:${MONTHS})\s+\d{4}\b`,
  String.raw`\b(?:${MONTHS})\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b`,
  String.raw`\b\d{4}[-‐‑]\d{2}[-‐‑]\d{2}\b`,
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[-‐‑]/g, '[-‐‑]');

export function highlightParts(text: string, literals: string[], currency = '') {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : '';
  const patterns = [
    ...literals.filter((l) => l.trim().length > 2).map(escape),
    ...(code ? [`${code}\\s?${AMOUNT}`, `${AMOUNT}\\s?${code}\\b`] : []),
    ...BASE_HIGHLIGHTS,
  ];
  const re = new RegExp(`(${patterns.join('|')})`, 'giu');
  return text.split(re).map((part, i) => ({ text: part, highlight: i % 2 === 1 }));
}
