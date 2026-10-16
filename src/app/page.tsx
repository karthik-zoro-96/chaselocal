'use client';

import { useState } from 'react';

export default function Home() {
  const [form, setForm] = useState({
    clientName: '',
    amount: '',
    dueDate: '',
    daysOverdue: '',
    workDescription: '',
    previousMessage: '',
    invoiceNumber: '',
  });
  const [drafts, setDrafts] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const extracted = data.extracted || {};
      setForm((prev) => ({
        ...prev,
        clientName: extracted.clientName || prev.clientName,
        amount: extracted.amount || prev.amount,
        dueDate: extracted.dueDate || prev.dueDate,
        workDescription: extracted.workDescription || prev.workDescription,
        invoiceNumber: extracted.invoiceNumber || prev.invoiceNumber,
      }));
    } catch (err: any) {
      setError(err.message || 'Could not extract from invoice');
    } finally {
      setExtracting(false);
    }
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    setDrafts('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDrafts(data.drafts);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ChaseLocal</h1>
        <p className="text-gray-600 mb-8">
          Upload an invoice or fill the details, then generate follow-up drafts.
        </p>

        <div className="bg-white rounded-lg shadow p-6 space-y-4 mb-6">
          <h2 className="text-lg font-semibold">Upload invoice (PDF, JPG, or PNG)</h2>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleUpload}
            disabled={extracting}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
          />
          {extracting && <p className="text-sm text-blue-600">Extracting details…</p>}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Invoice details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Client name</label>
            <input
              name="clientName"
              value={form.clientName}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="Jane Smith"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
              <input
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="1200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Days overdue</label>
              <input
                name="daysOverdue"
                type="number"
                value={form.daysOverdue}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="7"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due date</label>
            <input
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice number (optional)</label>
            <input
              name="invoiceNumber"
              value={form.invoiceNumber}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="INV-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Work description</label>
            <input
              name="workDescription"
              value={form.workDescription}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="Website redesign"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Previous message (optional)</label>
            <textarea
              name="previousMessage"
              value={form.previousMessage}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="Paste any prior follow-up"
            />
          </div>

          <button
            onClick={generate}
            disabled={loading || !form.clientName || !form.amount}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate follow-ups'}
          </button>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        {drafts && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Drafts</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{drafts}</pre>
          </div>
        )}
      </div>
    </main>
  );
}