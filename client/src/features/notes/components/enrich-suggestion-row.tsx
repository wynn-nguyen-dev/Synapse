import type { ReactNode } from 'react';

import { m } from '@/paraglide/messages';

import { Button } from '@/components/ui/button';

import { CheckIcon, XIcon } from 'lucide-react';

interface EnrichSuggestionRowProps {
  onDismiss: () => void;
  isApplying?: boolean;
  onApply: () => void;
  children: ReactNode;
  label: string;
}

export default function EnrichSuggestionRow({
  label,
  onApply,
  onDismiss,
  isApplying = false,
  children,
}: EnrichSuggestionRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <div className="mt-1 text-sm">{children}</div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onApply}
          disabled={isApplying}
          aria-label={m.notes_enrich_apply()}
          title={m.notes_enrich_apply()}
        >
          <CheckIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDismiss}
          aria-label={m.notes_enrich_dismiss()}
          title={m.notes_enrich_dismiss()}
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}
