'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Copy, ExternalLink, Link, Minimize2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { STAGES, highlightParts, readTime, splitSubject, wordCount, type Draft } from '@/lib/drafts';

const TWEAKS = [
  { id: 'payment-link', label: 'Add payment link', icon: Link },
  { id: 'concise', label: 'Make concise', icon: Minimize2 },
  { id: 'direct', label: 'More direct', icon: Zap },
];

type Props = {
  drafts: Draft[] | null;
  raw: string;
  highlights: string[];
  onUpdate: (index: number, draft: Draft) => void;
};

function DraftsHeading({ ready }: { ready: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="text-xl font-semibold tracking-tight">Drafts</h2>
      {ready && <Badge variant="secondary">3 drafts ready</Badge>}
    </div>
  );
}

export function DraftsSkeleton() {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-busy>
      <DraftsHeading ready={false} />
      <Skeleton className="mb-3 h-8 w-full" />
      <Card>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </motion.section>
  );
}

export function DraftsPanel({ drafts, raw, highlights, onUpdate }: Props) {
  const [active, setActive] = useState('0');
  const [tweaking, setTweaking] = useState<string | null>(null);

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
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: draft.subject, body: draft.body, tweak, stage: draft.label }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tweak failed');
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
    <motion.section
      id="drafts"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <DraftsHeading ready={!!drafts} />

      {!drafts ? (
        <Card>
          <CardContent>
            <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{raw}</pre>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="w-full">
            {STAGES.map((s, i) => (
              <TabsTrigger key={s.label} value={String(i)}>
                <span className={`size-1.5 rounded-full ${s.dot}`} />
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {drafts.map((draft, i) => {
            const stage = STAGES[i];
            const actions = (
              <>
                <Button onClick={() => copy(draft.body, 'Draft')}>
                  <Copy />
                  Copy draft
                </Button>
                <Button variant="outline" asChild>
                  <a href={`mailto:?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}>
                    <ExternalLink />
                    Open in Email
                  </a>
                </Button>
              </>
            );
            return (
              <TabsContent key={draft.label} value={String(i)}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={draft.body}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card>
                      <CardHeader className="sm:grid-cols-[1fr_auto]">
                        <CardTitle>{stage.stage}</CardTitle>
                        <CardDescription>
                          Recommended for {stage.recommended} · {readTime(draft.body)} · {wordCount(draft.body)} words
                        </CardDescription>
                        <div className="hidden gap-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:flex sm:self-start">
                          {actions}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 sm:hidden">{actions}</div>

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
                          {highlightParts(draft.body, highlights).map((part, j) =>
                            part.highlight ? (
                              <mark key={j} className="rounded-sm bg-muted px-1 py-0.5 font-medium text-foreground">
                                {part.text}
                              </mark>
                            ) : (
                              <span key={j}>{part.text}</span>
                            )
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="flex-wrap gap-2">
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
                      </CardFooter>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </motion.section>
  );
}
