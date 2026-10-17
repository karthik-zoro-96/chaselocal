'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { useAnimate } from 'motion/react';
import { format, isValid, parseISO } from 'date-fns';
import { ChevronDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { CURRENCIES } from '@/lib/currency';
import { daysSince } from '@/lib/drafts';
import { cn } from '@/lib/utils';

export type InvoiceFields = {
  clientName: string;
  amount: string;
  currency: string;
  dueDate: string;
  daysOverdue: string;
  invoiceNumber: string;
  senderName: string;
  workDescription: string;
  previousMessage: string;
};

type Change = (name: keyof InvoiceFields, value: string) => void;

type Props = {
  form: InvoiceFields;
  onChange: Change;
  highlight: { fields: string[]; id: number };
};

const labelClass = 'text-xs font-normal text-muted-foreground';

function Field({
  name,
  title,
  value,
  onChange,
  className,
  ...inputProps
}: { name: keyof InvoiceFields; title: string; value: string; onChange: Change } & Omit<
  ComponentProps<'input'>,
  'name' | 'value' | 'onChange'
>) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={name} className={labelClass}>
        {title}
      </Label>
      <Input
        id={name}
        name={name}
        data-field={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        {...inputProps}
      />
    </div>
  );
}

function AmountField({ amount, currency, onChange }: { amount: string; currency: string; onChange: Change }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor="amount" className={labelClass}>
        Amount
      </Label>
      <InputGroup data-field="amount">
        <InputGroupInput
          id="amount"
          name="amount"
          value={amount}
          onChange={(e) => onChange('amount', e.target.value)}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          placeholder="1200.00"
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton data-field="currency" aria-label={`Currency: ${currency}. Change currency`}>
                {currency}
                <ChevronDown />
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search currency…" />
                <CommandList>
                  <CommandEmpty>No currency found.</CommandEmpty>
                  <CommandGroup>
                    {CURRENCIES.map(({ code, name }) => (
                      <CommandItem
                        key={code}
                        value={`${code} ${name}`}
                        data-checked={code === currency}
                        onSelect={() => {
                          onChange('currency', code);
                          setOpen(false);
                        }}
                      >
                        <span className="w-10 font-medium">{code}</span>
                        <span className="truncate text-muted-foreground">{name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function DueDateCalendar({ selected, onSelect }: { selected?: Date; onSelect: (date?: Date) => void }) {
  const thisYear = new Date().getFullYear();
  return (
    <Calendar
      mode="single"
      selected={selected}
      defaultMonth={selected}
      onSelect={onSelect}
      captionLayout="dropdown"
      startMonth={new Date(thisYear - 10, 0)}
      endMonth={new Date(thisYear + 2, 11)}
      autoFocus
    />
  );
}

function DateField({ value, onChange }: { value: string; onChange: Change }) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor="dueDate" className={labelClass}>
        Due date
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="dueDate"
            data-field="dueDate"
            variant="outline"
            className={cn('w-full justify-between px-2.5 font-normal', !selected && 'text-muted-foreground')}
          >
            {selected ? format(selected, 'MMM d, yyyy') : 'Pick a date'}
            <ChevronDown className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <DueDateCalendar
            selected={selected}
            onSelect={(date) => {
              onChange('dueDate', date ? format(date, 'yyyy-MM-dd') : '');
              setOpen(false);
            }}
          />
          {selected && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange('dueDate', '');
                  setOpen(false);
                }}
              >
                Clear date
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function StatusField({ dueDate }: { dueDate: string }) {
  const days = dueDate ? daysSince(dueDate) : null;
  const overdue = days !== null && days > 0;
  const text =
    days === null
      ? 'Add a due date'
      : overdue
        ? `${days} ${days === 1 ? 'day' : 'days'} overdue`
        : days === 0
          ? 'Due today'
          : `Due in ${-days} ${days === -1 ? 'day' : 'days'}`;

  return (
    <div className="grid gap-1.5">
      <span className={labelClass}>Status</span>
      <div
        role="status"
        className={cn(
          'flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm',
          overdue
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
            : 'text-muted-foreground'
        )}
      >
        <Clock className="size-3.5" />
        {text}
      </div>
    </div>
  );
}

export function InvoiceForm({ form, onChange, highlight }: Props) {
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    if (!highlight.fields.length || !scope.current) return;
    const groups = highlight.fields
      .map((name) => scope.current.querySelector<HTMLElement>(`[data-field="${name}"]`))
      .filter((el): el is HTMLElement => !!el);
    if (!groups.length) return;
    animate(
      groups,
      { boxShadow: ['0 0 0 3px rgba(161, 161, 170, 0.7)', '0 0 0 3px rgba(161, 161, 170, 0)'] },
      { duration: 1.6, ease: 'easeOut' }
    ).then(() => groups.forEach((el) => (el.style.boxShadow = '')));
  }, [highlight, animate, scope]);

  return (
    <Card id="details" ref={scope}>
      <CardHeader>
        <CardTitle>Invoice details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-3 gap-y-4">
        <Field
          name="clientName"
          title="Client"
          value={form.clientName}
          onChange={onChange}
          placeholder="Acme Studio"
          autoComplete="organization"
        />
        <AmountField amount={form.amount} currency={form.currency} onChange={onChange} />
        <DateField value={form.dueDate} onChange={onChange} />
        <StatusField dueDate={form.dueDate} />
        <Field
          name="invoiceNumber"
          title="Invoice number"
          value={form.invoiceNumber}
          onChange={onChange}
          placeholder="INV-001"
        />
        <Field
          name="senderName"
          title="Sign as"
          value={form.senderName}
          onChange={onChange}
          placeholder="Your name"
          autoComplete="name"
        />
        <Field
          name="workDescription"
          title="Work description"
          value={form.workDescription}
          onChange={onChange}
          placeholder="Design and branding consulting"
          className="col-span-2"
        />
        <div className="col-span-2 grid gap-1.5">
          <Label htmlFor="previousMessage" className={labelClass}>
            Earlier messages · optional
          </Label>
          <Textarea
            id="previousMessage"
            name="previousMessage"
            value={form.previousMessage}
            onChange={(e) => onChange('previousMessage', e.target.value)}
            placeholder={'Paste a previous reply or promise, e.g. \u201cWill pay by Friday\u201d'}
            className="min-h-20"
          />
        </div>
      </CardContent>
    </Card>
  );
}
