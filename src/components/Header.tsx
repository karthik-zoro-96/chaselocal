import { Lock, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

export function PrivacyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground',
        className
      )}
    >
      <Lock className="size-3" />
      Photos read on your device · nothing stored
    </span>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Mail className="size-4" />
          </span>
          <span className="font-semibold">ChaseLocal</span>
        </a>
        <PrivacyBadge className="max-sm:hidden" />

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
