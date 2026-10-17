'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CircleAlert, Copy, Lightbulb, Mail, RefreshCw, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { postApi } from '@/lib/api';
import {
  STAGES,
  highlightParts,
  recommendedStage,
  splitSubject,
  stageStartDate,
  wordCount,
  type Draft,
} from '@/lib/drafts';
import { cn } from '@/lib/utils';

const TWEAKS = [
  { id: 'payment-link', label: 'Add payment link' },
  { id: 'concise', label: 'Shorter' },
  { id: 'direct', label: 'More direct' },
];

export type PanelStatus = 'waiting' | 'idle' | 'loading' | 'ready' | 'error';

type Props = {
  status: PanelStatus;
  drafts: Draft[] | null;
  raw: string;
  error: string;
  stale: boolean;
  canGenerate: boolean;
  highlights: string[];
  currency: string;
  dueDate: string;
  daysOverdue: string;
  senderName: string;
  onUpdate: (index: number, draft: Draft) => void;
  onGenerate: () => void;
};

function PreviewBox({ loading, children }: { loading: boolean; children?: React.ReactNode }) {
  const bar = cn('h-2.5', !loading && 'animate-none');
  return (
    <div className="space-y-4 rounded-lg border p-5" aria-busy={loading}>
      <Skeleton className={cn(bar, 'w-1/2')} />
      <div className="border-t" />
      <Skeleton className={cn(bar, 'w-1/4')} />
      <div className="space-y-2.5">
        <Skeleton className={cn(bar, 'w-11/12')} />
        <Skeleton className={cn(bar, 'w-5/6')} />
        <Skeleton className={cn(bar, 'w-2/3')} />
      </div>
      <div className="space-y-2.5">
        <Skeleton className={cn(bar, 'w-10/12')} />
        <Skeleton className={cn(bar, 'w-1/2')} />
      </div>
      {children && <div className="flex flex-col items-center gap-3 pt-2 text-center">{children}</div>}
    </div>
  );
}

function StatusLabel({ status, stale, onGenerate }: Pick<Props, 'status' | 'stale' | 'onGenerate'>) {
  const muted = 'text-xs text-muted-foreground';
  if (status === 'loading') {
    return (
      <span className={cn(muted, 'flex items-center gap-1.5')}>
        <Spinner className="size-3.5" />
        Writing drafts…
      </span>
    );
  }
  if (status === 'ready' && stale) {
    return (
      <span className={cn(muted, 'flex items-center gap-2')}>
        <span className="hidden sm:inline">Details changed</span>
        <Button variant="outline" size="xs" onClick={onGenerate}>
          <RefreshCw />
          Regenerate
        </Button>
      </span>
    );
  }
  const text = { waiting: 'Waiting for an invoice', idle: 'Not written yet', ready: 'Drafts ready', error: '' }[status];
  return text ? <span className={muted}>{text}</span> : null;
}

export function FollowUpsPanel(props: Props) {
  const { status, drafts, raw, error, canGenerate, highlights, currency, dueDate, daysOverdue, senderName } = props;
  const { onUpdate, onGenerate } = props;
  const recommended = recommendedStage(daysOverdue);
  const [active, setActive] = useState(String(recommended ?? 0));
  const [tweaking, setTweaking] = useState<string | null>(null);
  const hasTabs = status === 'ready' && !!drafts;

  const sign = (text: string) => (senderName.trim() ? text.replaceAll('[Your Name]', senderName.trim()) : text);
  const finalFrom = dueDate ? stageStartDate(dueDate, 2) : null;
  const nextStage = recommended !== null && recommended < 2 ? recommended + 1 : null;
  const nextFrom = nextStage !== null && dueDate ? stageStartDate(dueDate, nextStage) : null;

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied to clipboard`);
    } catch {
      toast.error('Could not access the clipboard');
    }
  };

  const applyTweak = async (draft: Draft, index: number, tweak: string, label: string) => {
    setTweaking(tweak);
    try {
      const data = await postApi<{ draft: string }>('/api/refine', {
        subject: draft.subject,
        body: draft.body,
        tweak,
        stage: draft.label,
      });
      const next = splitSubject(data.draft);
      onUpdate(index, { label: draft.label, subject: next.subject || draft.subject, body: next.body });
      toast.success(`${draft.label} draft updated: ${label.toLowerCase()}`);
    } catch (err) {
      toast.error((err instanceof Error && err.message) || 'Tweak failed');
    } finally {
      setTweaking(null);
    }
  };

  return (
    <section
      id="follow-ups"
      aria-label="Your follow-ups"
      className={cn('scroll-mt-20 space-y-3', status === 'waiting' && 'hidden lg:block')}
    >
      <Card>
        <CardHeader>
          <CardTitle>Your follow-ups</CardTitle>
          <CardAction>
            <StatusLabel {...props} />
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          <TabsPrimitive.Root value={active} onValueChange={setActive} className="space-y-4">
            <TabsPrimitive.List aria-label="Follow-up stage" className="grid grid-cols-3 gap-3">
              {STAGES.map((stage, i) => {
                const here = hasTabs && i === recommended;
                return (
                  <TabsPrimitive.Trigger
                    key={stage.label}
                    value={String(i)}
                    disabled={!hasTabs}
                    className={cn(
                      'group/stage min-w-0 rounded-sm pb-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default',
                      hasTabs && 'cursor-pointer'
                    )}
                  >
                    <span
                      className={cn(
                        'block h-0.5 rounded-full transition-opacity',
                        stage.dot,
                        hasTabs && 'opacity-30 group-hover/stage:opacity-60 group-data-[state=active]/stage:opacity-100'
                      )}
                    />
                    <span
                      className={cn(
                        'mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-medium',
                        hasTabs && 'text-muted-foreground group-data-[state=active]/stage:text-foreground'
                      )}
                    >
                      {stage.label}
                      {here && (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-px text-[0.7rem] font-medium text-amber-700 dark:text-amber-400">
                          Day {daysOverdue}
                          <span className="max-sm:hidden"> · you&apos;re here</span>
                        </span>
                      )}
                    </span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {i === 2 && finalFrom ? `From ${format(finalFrom, 'MMM d')}` : stage.range}
                    </span>
                  </TabsPrimitive.Trigger>
                );
              })}
            </TabsPrimitive.List>

            {status === 'waiting' && (
              <PreviewBox loading={false}>
                <p className="text-sm text-muted-foreground">Drafts appear here once your invoice is read.</p>
              </PreviewBox>
            )}

            {status === 'idle' && (
              <PreviewBox loading={false}>
                <p className="text-sm text-muted-foreground">
                  {canGenerate
                    ? 'Check the details, then write your follow-ups.'
                    : 'Add at least the client and amount to write follow-ups.'}
                </p>
                <Button onClick={onGenerate} disabled={!canGenerate}>
                  <Mail />
                  Write follow-ups
                </Button>
              </PreviewBox>
            )}

            {status === 'loading' && <PreviewBox loading />}

            {status === 'error' && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                  <span>{error}</span>
                  <Button variant="outline" size="xs" onClick={onGenerate}>
                    <RefreshCw />
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {status === 'ready' && !drafts && (
              <pre className="rounded-lg border p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">
                {sign(raw)}
              </pre>
            )}

            {hasTabs &&
              drafts.map((draft, i) => {
                const body = sign(draft.body);
                return (
                  <TabsPrimitive.Content key={draft.label} value={String(i)} className="outline-none">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={draft.body}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3"
                      >
                        <div className="rounded-lg border">
                          {draft.subject && (
                            <div className="flex items-center gap-3 border-b py-1.5 pr-1.5 pl-4">
                              <span className="text-xs text-muted-foreground">Subject</span>
                              <span className="min-w-0 flex-1 text-sm font-medium">{draft.subject}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => copy(draft.subject, 'Subject')}
                                    aria-label="Copy subject"
                                  >
                                    <Copy />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy subject</TooltipContent>
                              </Tooltip>
                            </div>
                          )}

                          <div className="p-4 text-sm leading-7 break-words whitespace-pre-wrap">
                            {highlightParts(body, highlights, currency).map((part, j) =>
                              part.highlight ? (
                                <mark key={j} className="rounded-sm bg-muted px-1 py-0.5 font-medium text-foreground">
                                  {part.text}
                                </mark>
                              ) : (
                                <span key={j}>{part.text}</span>
                              )
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2.5">
                            <span className="text-xs text-muted-foreground">Tweak</span>
                            {TWEAKS.map(({ id, label }) => (
                              <Button
                                key={id}
                                variant="outline"
                                size="xs"
                                onClick={() => applyTweak(draft, i, id, label)}
                                disabled={!!tweaking}
                              >
                                {tweaking === id && <Spinner />}
                                {label}
                              </Button>
                            ))}
                            <span className="ml-auto text-xs text-muted-foreground">{wordCount(body)} words</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => copy(body, 'Draft')}>
                            <Copy />
                            Copy
                          </Button>
                          <Button asChild>
                            <a href={`mailto:?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(body)}`}>
                              <Send />
                              Open in email
                            </a>
                          </Button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </TabsPrimitive.Content>
                );
              })}
          </TabsPrimitive.Root>

          {hasTabs && nextStage !== null && nextFrom && (
            <p className="border-t pt-4 text-xs text-muted-foreground">
              Still unpaid on <span className="font-medium text-foreground">{format(nextFrom, 'MMM d')}</span>? The{' '}
              {STAGES[nextStage].label} draft becomes the recommendation.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="flex gap-2 px-1 text-sm text-muted-foreground">
        <Lightbulb className="mt-0.5 size-4 shrink-0" />
        <span>
          Attach the original invoice to your follow-up so there&apos;s no &ldquo;I didn&apos;t get the
          attachment&rdquo; delay.
        </span>
      </p>
    </section>
  );
}
