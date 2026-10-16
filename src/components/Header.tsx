import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '#top', label: 'Overview' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#drafts-area', label: 'Email Templates' },
];

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
        <Separator orientation="vertical" className="hidden h-5! lg:block" />
        <span className="hidden truncate text-sm text-muted-foreground lg:block">
          Turn overdue invoices into polite follow-ups
        </span>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Button key={item.href} variant="ghost" size="sm" asChild>
              <a href={item.href}>{item.label}</a>
            </Button>
          ))}
        </nav>

        <div className="ml-auto md:ml-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
