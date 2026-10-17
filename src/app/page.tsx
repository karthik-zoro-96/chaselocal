'use client';

import { useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { FileText, Lightbulb, ListChecks, Send } from 'lucide-react';
import { Header } from '@/components/Header';
import { UploadCard, ACCEPTED_TYPES } from '@/components/UploadCard';
import { InvoiceForm, type InvoiceFields } from '@/components/InvoiceForm';
import { DraftsPanel, DraftsSkeleton } from '@/components/DraftsPanel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
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
  { icon: FileText, title: 'Add the invoice', text: 'Upload a PDF or photo, or type the details in yourself.' },
  { icon: ListChecks, title: 'Check the details', text: 'Fix anything the extraction missed and add prior messages for context.' },
  { icon: Send, title: 'Send the right tone', text: 'Pick Polite, Firm, or Final Notice, tweak it, and send it from your email app.' },
];

function overdueFrom(dueDate: string) {
  const days = daysSince(dueDate);
  return days === null ? '' : String(Math.max(0, days));
}

export default function Home() {
  const [form, setForm] = useState<InvoiceFields>(EMPTY_FORM);
  const [fileName, setFileName] = useState('');
  const [extractedFrom, setExtractedFrom] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [highlight, setHighlight] = useState<{ fields: string[]; id: number }>({ fields: [], id: 0 });

  const [rawDrafts, setRawDrafts] = useState('');
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [draftsOverdue, setDraftsOverdue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (name: keyof InvoiceFields, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'dueDate' ? { daysOverdue: overdueFrom(value) } : {}),
    }));
  };

  const handleFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type. Upload a PDF, JPG, or PNG.');
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
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const extracted = data.extracted || {};
      setForm((prev) => {
        const next = { ...prev };
        for (const name of EXTRACTED_FIELDS) next[name] = extracted[name] || prev[name];
        if (extracted.dueDate) next.daysOverdue = overdueFrom(extracted.dueDate);
        return next;
      });
      setFileName(file.name);
      setExtractedFrom(file.type === 'application/pdf' ? 'PDF' : 'image');
      setHighlight((prev) => ({
        fields: EXTRACTED_FIELDS.filter((name) => extracted[name]),
        id: prev.id + 1,
      }));
    } catch (err) {
      setUploadError((err instanceof Error && err.message) || 'Could not extract from invoice');
    } finally {
      setExtracting(false);
    }
  };

  const clearFile = () => {
    setFileName('');
    setExtractedFrom('');
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

  const generate = async () => {
    setLoading(true);
    setError('');
    setRawDrafts('');
    setDrafts(null);
    setDraftsOverdue(form.daysOverdue);
    requestAnimationFrame(() =>
      document.getElementById('drafts-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRawDrafts(data.drafts);
      setDrafts(splitDrafts(data.drafts));
    } catch (err) {
      setError((err instanceof Error && err.message) || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (index: number, draft: Draft) => {
    setDrafts((prev) => prev && prev.map((d, i) => (i === index ? draft : d)));
  };

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={300}>
        <Header />

        <main id="top" className="flex-1">
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Smart Follow-up Generator</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Extract overdue invoice details and draft follow-up emails in three escalating tones.
              </p>
            </div>

            <UploadCard
              fileName={fileName}
              extracting={extracting}
              error={uploadError}
              onFile={handleFile}
              onClear={clearFile}
              onSample={loadSample}
            />

            <InvoiceForm
              form={form}
              onChange={updateField}
              extractedFrom={extractedFrom}
              highlight={highlight}
              loading={loading}
              error={error}
              onGenerate={generate}
            />

            <div id="drafts-area" className="scroll-mt-20">
              <AnimatePresence mode="wait">
                {loading ? (
                  <DraftsSkeleton key="skeleton" />
                ) : (
                  rawDrafts && (
                    <DraftsPanel
                      key={rawDrafts}
                      drafts={drafts}
                      raw={rawDrafts}
                      highlights={[form.invoiceNumber, form.workDescription]}
                      currency={form.currency}
                      daysOverdue={draftsOverdue}
                      onUpdate={updateDraft}
                    />
                  )
                )}
              </AnimatePresence>
            </div>

            <Alert>
              <Lightbulb />
              <AlertTitle>Freelancer pro-tip</AlertTitle>
              <AlertDescription>
                Attach the original invoice to your follow-up so the client has everything they need to pay, and
                there&apos;s no &ldquo;I didn&apos;t receive the attachment&rdquo; delay.
              </AlertDescription>
            </Alert>

            <section>
              <h2 className="mb-3 text-xl font-semibold tracking-tight">How it works</h2>
              <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {STEPS.map(({ icon: Icon, title, text }, i) => (
                  <li key={title}>
                    <Card size="sm" className="h-full">
                      <CardHeader>
                        <CardDescription className="flex items-center gap-2">
                          <Icon className="size-4" />
                          Step {i + 1}
                        </CardDescription>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{text}</CardDescription>
                      </CardHeader>
                    </Card>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </main>

        <footer className="border-t">
          <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              <span className="font-medium text-foreground">ChaseLocal</span> — Respectful follow-ups for independent
              professionals.
            </p>
          </div>
        </footer>

        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  );
}
