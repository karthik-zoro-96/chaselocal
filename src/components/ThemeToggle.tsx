'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { setDarkMode, useIsDark } from '@/hooks/use-is-dark';

export function ThemeToggle() {
  const dark = useIsDark();
  const label = `Switch to ${dark ? 'light' : 'dark'} mode`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" onClick={() => setDarkMode(!dark)} aria-label={label}>
          {dark ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
