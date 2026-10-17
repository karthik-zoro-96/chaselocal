'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { toast } from 'sonner';
import { CircleAlert, Copy, ExternalLink, Lightbulb, Link, Minimize2, RefreshCw, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { postApi } from '@/lib/api';
import {
  STAGES,
  highlightParts,
  readTime,
  recommendedStage,
  splitSubject,
  wordCount,
  type Draft,
} from '@/lib/drafts';
import { cn } from '@/lib/utils';

const TWEAKS = [
  { id: 'payment-link', label: 'Add payment link', icon: Link },
  { id: 'concise', label: 'Make concise', icon: Minimize2 },
  { id: 'direct', label: 'More direct', icon: Zap },
];

export type PanelStatus = 'empty' | 'loading' | 'ready' | 'error';

type Props = {
  status: PanelStatus;
  drafts: Draft[] | null;
  raw: string;
  error: string;
  stale: boolean;
  highlights: string[];
  currency: string;
  daysOverdue: string;
  onUpdate: (index: number, draft: Draft) => void;
  onRegenerate: () => void;
};

function PreviewBox({ loading, caption }: { loading: boolean; caption?: string }) {
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
      {caption && <p className="pt-2 text-center text-sm text-muted-foreground">{caption}</p>}
    </div>
  );
}

function StatusLabel({ status, drafts, stale, onRegenerate }: Pick<Props, 'status' | 'drafts' | 'stale' | 'onRegenerate'>) {
  if (status === 'loading') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Spinner className="size-3.5" />
        Writing drafts…
      </span>
    );
  }
  if (status === 'ready' && stale) {
    return (
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="hidden sm:inline">Details changed</span>
        <Button variant="outline" size="xs" onClick={onRegenerate}>
          <RefreshCw />
          Regenerate
        </Button>
      </span>
    );
  }
  if (status === 'ready') {
    return <span className="text-xs text-muted-foreground">{drafts ? '3 drafts ready' : 'Draft ready'}</span>;
  }
  if (status === 'empty') {
    return <span className="text-xs text-muted-foreground">Waiting for an invoice</span>;
  }
  return null;
}

export function FollowUpsPanel(props: Props) {
  const { status, drafts, raw, error, highlights, currency, daysOverdue, onUpdate, onRegenerate } = props;
  const recommended = recommendedStage(daysOverdue);
  const [active, setActive] = useState(String(recommended ?? 0));
  const [tweaking, setTweaking] = useState<string | null>(null);
  const hasTabs = status === 'ready' && !!drafts;

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
      className={cn('scroll-mt-20 space-y-3', status === 'empty' && 'hidden lg:block')}
    >
      <Card>
        <CardHeader>
          <CardTitle>Your follow-ups</CardTitle>
          <CardAction>
            <StatusLabel {...props} />
          </CardAction>
        </CardHeader>

        <CardContent>
          <TabsPrimitive.Root value={active} onValueChange={setActive} className="space-y-4">
            <TabsPrimitive.List aria-label="Follow-up stage" className="grid grid-cols-3 gap-3">
              {STAGES.map((stage, i) => (
                <TabsPrimitive.Trigger
                  key={stage.label}
                  value={String(i)}
                  disabled={!hasTabs}
                  className={cn(
                    'group/stage rounded-sm pb-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default',
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
                      'mt-2.5 flex items-center gap-1.5 text-sm font-medium',
                      hasTabs && 'text-muted-foreground group-data-[state=active]/stage:text-foreground'
                    )}
                  >
                    {stage.label}
                    {hasTabs && i === recommended && (
                      <>
                        <Badge variant="secondary" className="hidden sm:inline-flex">
                          Suggested
                        </Badge>
                        <span className="sr-only sm:hidden">(suggested)</span>
                      </>
                    )}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{stage.recommended}</span>
                </TabsPrimitive.Trigger>
              ))}
            </TabsPrimitive.List>

            {status === 'empty' && <PreviewBox loading={false} caption="Drafts appear here once your invoice is read." />}
            {status === 'loading' && <PreviewBox loading />}

            {status === 'error' && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                  <span>{error}</span>
                  <Button variant="outline" size="xs" onClick={onRegenerate}>
                    <RefreshCw />
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {status === 'ready' && !drafts && (
              <pre className="rounded-lg border bg-muted/40 p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">
                {raw}
              </pre>
            )}

            {hasTabs && recommended !== null && (
              <p className="text-sm text-muted-foreground">
                {daysOverdue} {Number(daysOverdue) === 1 ? 'day' : 'days'} overdue, so we suggest the{' '}
                <span className="font-medium text-foreground">{STAGES[recommended].label}</span> draft.
              </p>
            )}

            {hasTabs &&
              drafts.map((draft, i) => (
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
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{STAGES[i].stage}</p>
                          <p className="text-xs text-muted-foreground">
                            {readTime(draft.body)} · {wordCount(draft.body)} words
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => copy(draft.body, 'Draft')}>
                            <Copy />
                            Copy draft
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={`mailto:?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}
                            >
                              <ExternalLink />
                              Open in email
                            </a>
                          </Button>
                        </div>
                      </div>

                      {draft.subject && (
                        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                          <p className="min-w-0 text-sm">
                            <span className="text-muted-foreground">Subject: </span>
                            <span className="font-medium">{draft.subject}</span>
                          </p>
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

                      <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-7 break-words whitespace-pre-wrap">
                        {highlightParts(draft.body, highlights, currency).map((part, j) =>
                          part.highlight ? (
                            <mark key={j} className="rounded-sm bg-muted px-1 py-0.5 font-medium text-foreground">
                              {part.text}
                            </mark>
                          ) : (
                            <span key={j}>{part.text}</span>
                          )
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Quick tweaks:</span>
                        {TWEAKS.map(({ id, label, icon: Icon }) => (
                          <Button
                            key={id}
                            variant="outline"
                            size="xs"
                            onClick={() => applyTweak(draft, i, id, label)}
                            disabled={!!tweaking}
                          >
                            {tweaking === id ? <Spinner /> : <Icon />}
                            {label}
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </TabsPrimitive.Content>
              ))}
          </TabsPrimitive.Root>
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
