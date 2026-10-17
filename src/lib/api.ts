// Vercel rejects request bodies over 4.5 MB before the route runs.
export const MAX_PDF_BYTES = 4 * 1024 * 1024;

const STATUS_MESSAGES: Record<number, string> = {
  413: 'That file is too large. The limit is 4 MB.',
  429: 'Too many requests. Please wait a few minutes and try again.',
  504: 'The server took too long to respond. Please try again.',
};

export async function postApi<T>(url: string, body: FormData | object): Promise<T> {
  let res: Response;
  try {
    res =
      body instanceof FormData
        ? await fetch(url, { method: 'POST', body })
        : await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(data?.error || STATUS_MESSAGES[res.status] || 'Something went wrong. Please try again.');
  }
  return data as T;
}
