'use client';

import { useEffect, useState, type ComponentProps, type ComponentType, type ReactNode } from 'react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { format, isValid, parseISO } from 'date-fns';
import {
  Briefcase,
  Building2,
  CalendarIcon,
  ChevronDown,
  CircleAlert,
  Clock,
  DollarSign,
  Hash,
  Mail,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export type InvoiceFields = {
  clientName: string;
  amount: string;
  dueDate: string;
  daysOverdue: string;
  workDescription: string;
  previousMessage: string;
  invoiceNumber: string;
};

type Props = {
  form: InvoiceFields;
  onChange: (name: keyof InvoiceFields, value: string) => void;
  extractedFrom: string;
  highlight: { fields: string[]; id: number };
  loading: boolean;
  error: string;
  onGenerate: () => void;
};

type FieldProps = {
  name: keyof InvoiceFields;
  title: string;
  icon: ComponentType;
  aside?: ReactNode;
  value: string;
  onChange: (name: keyof InvoiceFields, value: string) => void;
} & Omit<ComponentProps<'input'>, 'name' | 'value' | 'onChange'>;

function Field({ name, title, icon: Icon, aside, value, onChange, ...inputProps }: FieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor={name}>{title}</Label>
        {aside}
      </div>
      <InputGroup data-field={name}>
        <InputGroupAddon>
          <Icon />
        </InputGroupAddon>
        <InputGroupInput
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          {...inputProps}
        />
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

function DateField({
  name,
  title,
  value,
  onChange,
}: {
  name: keyof InvoiceFields;
  title: string;
  value: string;
  onChange: (name: keyof InvoiceFields, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <div className="grid gap-2">
      <div className="flex min-h-5 items-center">
        <Label htmlFor={name}>{title}</Label>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={name}
            data-field={name}
            variant="outline"
            className={cn('w-full justify-start px-2 font-normal', !selected && 'text-muted-foreground')}
          >
            <CalendarIcon className="text-muted-foreground" />
            {selected ? format(selected, 'PPP') : 'Pick a date'}
            <ChevronDown className="ml-auto text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <DueDateCalendar
            selected={selected}
            onSelect={(date) => {
              onChange(name, date ? format(date, 'yyyy-MM-dd') : '');
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
                  onChange(name, '');
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

export function InvoiceForm({ form, onChange, extractedFrom, highlight, loading, error, onGenerate }: Props) {
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

  const overdue = Number(form.daysOverdue);

  return (
    <Card id="details" ref={scope}>
      <CardHeader>
        <CardTitle>Invoice details</CardTitle>
        <CardDescription>Verify or edit the extracted information before generating drafts.</CardDescription>
        <CardAction>
          <AnimatePresence>
            {extractedFrom && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Badge variant="secondary">Extracted from {extractedFrom}</Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            name="clientName"
            title="Client name"
            icon={Building2}
            value={form.clientName}
            onChange={onChange}
            placeholder="Acme Studio"
            autoComplete="organization"
          />
          <Field
            name="amount"
            title="Amount ($)"
            icon={DollarSign}
            value={form.amount}
            onChange={onChange}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="1200.00"
          />
          <DateField name="dueDate" title="Due date" value={form.dueDate} onChange={onChange} />
          <Field
            name="daysOverdue"
            title="Days overdue"
            icon={Clock}
            value={form.daysOverdue}
            onChange={onChange}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Auto from due date"
            aside={
              overdue > 0 ? (
                <Badge variant="destructive">
                  {overdue} {overdue === 1 ? 'day' : 'days'} overdue
                </Badge>
              ) : null
            }
          />
          <Field
            name="invoiceNumber"
            title="Invoice number"
            icon={Hash}
            value={form.invoiceNumber}
            onChange={onChange}
            placeholder="INV-001"
          />
          <Field
            name="workDescription"
            title="Work description"
            icon={Briefcase}
            value={form.workDescription}
            onChange={onChange}
            placeholder="Design and branding consulting"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="previousMessage">
            Previous communication <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="previousMessage"
            name="previousMessage"
            value={form.previousMessage}
            onChange={(e) => onChange('previousMessage', e.target.value)}
            placeholder="Paste any prior follow-up conversation or verbal commitment here…"
            className="min-h-20"
          />
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
      </CardContent>

      <CardFooter className="flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <p className="text-xs text-muted-foreground">Tone calibrated across 3 escalating stages</p>
        <Button
          onClick={onGenerate}
          disabled={loading || !form.clientName || !form.amount}
          className="w-full sm:w-auto"
        >
          {loading ? <Spinner /> : <Mail />}
          {loading ? 'Generating…' : 'Generate follow-ups'}
        </Button>
      </CardFooter>
    </Card>
  );
}
