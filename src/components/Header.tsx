import { Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
        <a href="#top" className="flex shrink-0 items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Mail className="size-4" />
          </span>
          <span className="font-semibold">ChaseLocal</span>
        </a>
        <Separator orientation="vertical" className="hidden h-5! sm:block" />
        <span className="hidden truncate text-sm text-muted-foreground sm:block">
          Turn overdue invoices into polite follow-ups
        </span>

        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
