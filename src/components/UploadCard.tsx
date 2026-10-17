'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, FileText, PenLine, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

type Props = {
  extracting: boolean;
  error: string;
  onFile: (file: File) => void;
  onSample: () => void;
  onManual: () => void;
};

export function UploadCard({ extracting, error, onFile, onSample, onManual }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (file?: File) => {
    if (file) onFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const browse = () => {
    if (!extracting) inputRef.current?.click();
  };

  return (
    <div id="upload" className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={extracting}
        aria-label="Upload invoice file"
        onClick={browse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            browse();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!extracting) pick(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-foreground/25 bg-card px-6 py-10 text-center outline-none transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          dragging && 'border-ring bg-muted/50',
          extracting && 'cursor-wait'
        )}
      >
        <span className="mb-3 grid size-10 place-items-center rounded-lg bg-muted">
          {extracting ? <Spinner className="size-5" /> : <Upload className="size-5" />}
        </span>
        <p className="font-medium">{extracting ? 'Reading your invoice…' : 'Drop your invoice here'}</p>
        <p className="text-sm text-balance text-muted-foreground">
          PDF (up to 4 MB), JPG or PNG · photos are read on your device
        </p>
        <span aria-hidden className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-4')}>
          Choose file
        </span>
        <input
          ref={inputRef}
          id="invoice-file"
          name="invoice-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <Button variant="link" size="sm" className="h-auto px-0 text-foreground" onClick={onManual} disabled={extracting}>
          Enter details manually
        </Button>
        <Button variant="link" size="sm" className="h-auto px-0 text-foreground" onClick={onSample} disabled={extracting}>
          Try a sample invoice
        </Button>
        <Button variant="link" size="sm" className="h-auto px-0 text-muted-foreground" asChild>
          <a href="/sample-invoice.pdf" target="_blank" rel="noopener noreferrer">
            View the sample
          </a>
        </Button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div key={error} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FileName({ name }: { name: string }) {
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot) : '';
  const base = name.slice(0, name.length - ext.length);
  const tail = base.length > 8 ? base.slice(-4) : '';
  return (
    <p className="flex min-w-0 text-sm font-medium" title={name}>
      <span className="truncate">{base.slice(0, base.length - tail.length)}</span>
      <span className="shrink-0">
        {tail}
        {ext}
      </span>
    </p>
  );
}

type SummaryProps = {
  fileName: string;
  fieldsRead: number;
  extracting: boolean;
  error: string;
  onFile: (file: File) => void;
  onReset: () => void;
};

export function FileSummary({ fileName, fieldsRead, extracting, error, onFile, onReset }: SummaryProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
          {extracting ? (
            <Spinner className="size-4" />
          ) : fileName ? (
            <FileText className="size-4" />
          ) : (
            <PenLine className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          {extracting || !fileName ? (
            <p className="truncate text-sm font-medium">{extracting ? 'Reading your invoice…' : 'Manual entry'}</p>
          ) : (
            <FileName name={fileName} />
          )}
          <p className="text-xs text-muted-foreground">
            {fileName ? `Read ${fieldsRead} fields · check them below` : 'Type the details below, or upload a file'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={extracting}>
          {fileName ? 'Replace' : 'Upload'}
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onReset} disabled={extracting}>
          Start over
        </Button>
        <input
          ref={inputRef}
          id="replace-invoice-file"
          name="replace-invoice-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
