'use client';

import { useState } from 'react';
import { MotionConfig } from 'motion/react';
import { FollowUpsPanel, type PanelStatus } from '@/components/FollowUpsPanel';
import { Header, PrivacyBadge } from '@/components/Header';
import { InvoiceForm, type InvoiceFields } from '@/components/InvoiceForm';
import { ACCEPTED_TYPES, FileSummary, UploadCard } from '@/components/UploadCard';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MAX_PDF_BYTES, postApi } from '@/lib/api';
import { DEFAULT_CURRENCY } from '@/lib/currency';
import { daysSince, splitDrafts, type Draft } from '@/lib/drafts';
import { readImageText } from '@/lib/ocr';

const EMPTY_FORM: InvoiceFields = {
  clientName: '',
  amount: '',
  currency: DEFAULT_CURRENCY,
  dueDate: '',
  daysOverdue: '',
  workDescription: '',
  previousMessage: '',
  invoiceNumber: '',
};

const EXTRACTED_FIELDS = ['clientName', 'amount', 'currency', 'dueDate', 'workDescription', 'invoiceNumber'] as const;

const STEPS = [
  ['Add the invoice.', 'We pull out the client, amount, due date and number.'],
  ['Check the details.', 'Fix anything the extraction missed.'],
  ['Send the right tone.', 'We suggest a stage based on how late the payment is.'],
];

function overdueFrom(dueDate: string) {
  const days = daysSince(dueDate);
  return days === null ? '' : String(Math.max(0, days));
}

export default function Home() {
  const [form, setForm] = useState<InvoiceFields>(EMPTY_FORM);
  const [fileName, setFileName] = useState('');
  const [source, setSource] = useState('');
  const [manual, setManual] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [highlight, setHighlight] = useState<{ fields: string[]; id: number }>({ fields: [], id: 0 });

  const [rawDrafts, setRawDrafts] = useState('');
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [generation, setGeneration] = useState({ id: 0, overdue: '', snapshot: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const status: PanelStatus = loading ? 'loading' : error ? 'error' : rawDrafts ? 'ready' : 'empty';
  const stale = status === 'ready' && generation.snapshot !== JSON.stringify(form);

  const updateField = (name: keyof InvoiceFields, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'dueDate' ? { daysOverdue: overdueFrom(value) } : {}),
    }));
  };

  const generate = async (fields: InvoiceFields = form) => {
    setLoading(true);
    setError('');
    setRawDrafts('');
    setDrafts(null);
    setGeneration((prev) => ({ id: prev.id + 1, overdue: fields.daysOverdue, snapshot: JSON.stringify(fields) }));
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setTimeout(() => document.getElementById('follow-ups')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
    try {
      const data = await postApi<{ drafts: string }>('/api/generate', fields);
      setRawDrafts(data.drafts);
      setDrafts(splitDrafts(data.drafts));
    } catch (err) {
      setError((err instanceof Error && err.message) || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type. Upload a PDF, JPG, or PNG.');
      return;
    }
    if (file.type === 'application/pdf' && file.size > MAX_PDF_BYTES) {
      setUploadError('That PDF is too large. The limit is 4 MB.');
      return;
    }

    setExtracting(true);
    setUploadError('');
    try {
      const formData = new FormData();
      if (file.type === 'application/pdf') {
        formData.append('file', file);
      } else {
        const text = await readImageText(file).catch(() => {
          throw new Error('Could not read this image. Try a clearer photo or enter details manually.');
        });
        formData.append('text', text);
      }
      const { extracted } = await postApi<{ extracted: Partial<InvoiceFields> }>('/api/upload', formData);

      const found = EXTRACTED_FIELDS.filter((name) => name !== 'currency' && extracted[name]);
      if (!found.length) {
        throw new Error("We couldn't find invoice details in this file. Try another file or enter the details manually.");
      }

      const next = { ...form };
      for (const name of EXTRACTED_FIELDS) next[name] = extracted[name] || form[name];
      if (extracted.dueDate) next.daysOverdue = overdueFrom(extracted.dueDate);

      setForm(next);
      setFileName(file.name);
      setSource(file.type === 'application/pdf' ? 'PDF' : 'photo');
      setHighlight((prev) => ({
        fields: EXTRACTED_FIELDS.filter((name) => extracted[name]),
        id: prev.id + 1,
      }));
      if (next.clientName && next.amount) generate(next);
    } catch (err) {
      setUploadError((err instanceof Error && err.message) || 'Could not extract from invoice');
    } finally {
      setExtracting(false);
    }
  };

  const loadSample = async () => {
    try {
      const res = await fetch('/sample-invoice.pdf');
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      await handleFile(new File([blob], 'sample-invoice.pdf', { type: 'application/pdf' }));
    } catch {
      setUploadError('Could not load the sample invoice');
    }
  };

  const startOver = () => {
    setForm(EMPTY_FORM);
    setFileName('');
    setSource('');
    setManual(false);
    setUploadError('');
    setRawDrafts('');
    setDrafts(null);
    setError('');
  };

  const updateDraft = (index: number, draft: Draft) => {
    setDrafts((prev) => prev && prev.map((d, i) => (i === index ? draft : d)));
  };

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={300}>
        <Header />

        <main id="top" className="flex-1">
          <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Chase the invoice, not the client.
                </h1>
                <p className="text-pretty text-muted-foreground">
                  Drop an overdue invoice and get three follow-ups that escalate politely, from a friendly nudge to a
                  final notice.
                </p>
                <PrivacyBadge className="sm:hidden" />
              </div>

              {fileName || manual ? (
                <>
                  <FileSummary fileName={fileName} source={source} onReset={startOver} />
                  <InvoiceForm
                    form={form}
                    onChange={updateField}
                    highlight={highlight}
                    hasDrafts={!!rawDrafts}
                    loading={loading}
                    onGenerate={() => generate()}
                  />
                </>
              ) : (
                <>
                  <UploadCard
                    extracting={extracting}
                    error={uploadError}
                    onFile={handleFile}
                    onSample={loadSample}
                    onManual={() => {
                      setUploadError('');
                      setManual(true);
                    }}
                  />
                  <ol className="space-y-3 border-t pt-5 text-sm">
                    {STEPS.map(([title, text], i) => (
                      <li key={title} className="flex gap-3">
                        <span className="pt-px font-mono text-xs text-muted-foreground">0{i + 1}</span>
                        <p>
                          <span className="font-medium">{title}</span>{' '}
                          <span className="text-muted-foreground">{text}</span>
                        </p>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>

            <FollowUpsPanel
              key={generation.id}
              status={status}
              drafts={drafts}
              raw={rawDrafts}
              error={error}
              stale={stale}
              highlights={[form.invoiceNumber, form.workDescription]}
              currency={form.currency}
              daysOverdue={generation.overdue}
              onUpdate={updateDraft}
              onRegenerate={() => generate()}
            />
          </div>
        </main>

        <footer className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-5 text-sm text-muted-foreground sm:px-6">
            <span className="font-medium text-foreground">ChaseLocal</span> · Respectful follow-ups for independent
            professionals.
          </div>
        </footer>

        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  );
}
