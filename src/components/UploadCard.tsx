'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert, CircleCheck, CloudUpload, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

type Props = {
  fileName: string;
  extracting: boolean;
  error: string;
  onFile: (file: File) => void;
  onClear: () => void;
};

export function UploadCard({ fileName, extracting, error, onFile, onClear }: Props) {
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
    <Card id="upload">
      <CardHeader>
        <CardTitle>Upload invoice</CardTitle>
        <CardDescription>PDF, JPG, or PNG. Only the extracted text is sent to your configured model.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
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
            'flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-8 text-center outline-none transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            dragging && 'border-ring bg-muted/50',
            extracting && 'cursor-wait opacity-70'
          )}
        >
          {extracting ? (
            <Spinner className="size-6 text-muted-foreground" />
          ) : (
            <CloudUpload className="size-6 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {extracting ? 'Reading your invoice…' : 'Drag and drop your invoice here'}
          </p>
          <p className="text-xs text-muted-foreground">
            or <span className="font-medium text-foreground underline underline-offset-4">click to browse</span>
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>

        <AnimatePresence>
          {fileName && !extracting && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Badge variant="secondary" className="h-6 max-w-full pr-0.5">
                <CircleCheck />
                <span className="max-w-[12rem] truncate sm:max-w-xs">{fileName} parsed</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-xs" onClick={onClear} aria-label="Clear uploaded file">
                      <X />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear file</TooltipContent>
                </Tooltip>
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

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
      </CardContent>
    </Card>
  );
}
