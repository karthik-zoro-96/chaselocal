export const DEFAULT_CURRENCY = 'USD';

const CODES = Intl.supportedValuesOf('currency');
const names = new Intl.DisplayNames(['en'], { type: 'currency' });

export const CURRENCIES = CODES.map((code) => ({ code, name: names.of(code) ?? code }));

export function isCurrency(code: string) {
  return CODES.includes(code);
}

export function formatMoney(amount: string, code: string) {
  const value = Number(amount);
  if (!amount || !Number.isFinite(value) || !isCurrency(code)) return `${amount} ${code}`.trim();
  return new Intl.NumberFormat('en', { style: 'currency', currency: code }).format(value);
}
