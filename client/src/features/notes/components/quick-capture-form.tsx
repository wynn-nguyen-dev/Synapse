import type { AttachedFile } from '@/features/notes/hooks/use-note-create';
import type { NoteFormInput } from '@/features/notes/schemas';
import type { ChangeEvent, KeyboardEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { Controller } from 'react-hook-form';
import { useRef } from 'react';

import { toast } from 'sonner';

import { m } from '@/paraglide/messages';

import { Field, FieldError } from '@/components/ui/field';
import { DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Loader2Icon, PaperclipIcon, SaveIcon, XIcon } from 'lucide-react';

import {
  createPastedFile,
  extractLeadLine,
  shouldConvertPasteToFile,
} from '@/features/notes/attachments';

interface AttachedFilesState {
  onAttach: (files: Array<File>) => void;
  onRemove: (id: string) => void;
  files: Array<AttachedFile>;
}

interface QuickCaptureFormProps {
  form: UseFormReturn<NoteFormInput>;
  attachments: AttachedFilesState;
  onCancel: () => void;
  hasContent: boolean;
  isCreating: boolean;
  onSave: () => void;
}

export default function QuickCaptureForm({
  form,
  attachments,
  hasContent,
  isCreating,
  onCancel,
  onSave,
}: QuickCaptureFormProps) {
  const { control } = form;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onSave();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    attachments.onAttach(files);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      {attachments.files.length > 0 && (
        <span className="mb-2 flex flex-wrap gap-1.5">
          {attachments.files.map((entry) => (
            <Badge key={entry.id} variant="secondary" className="gap-1 pr-1">
              {entry.file.name}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => attachments.onRemove(entry.id)}
                disabled={isCreating}
                aria-label={m.notes_enrich_tag_remove({ tag: entry.file.name })}
                className="size-4 rounded-full"
              >
                <XIcon />
              </Button>
            </Badge>
          ))}
        </span>
      )}

      <Controller
        name="content"
        control={control}
        render={({ fieldState, field }) => (
          <Field data-invalid={fieldState.invalid}>
            <Textarea
              {...field}
              autoFocus
              rows={5}
              disabled={isCreating}
              placeholder={m.notes_page_create_content_placeholder()}
              aria-invalid={fieldState.invalid}
              onKeyDown={handleTextareaKeyDown}
              onPaste={(event) => {
                const text = event.clipboardData.getData('text');
                if (!shouldConvertPasteToFile(text)) return;
                event.preventDefault();
                attachments.onAttach([createPastedFile(text)]);
                if (!field.value.trim()) {
                  field.onChange(extractLeadLine(text));
                }
                toast.success(m.notes_attachments_pasted_file());
              }}
            />

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <DialogFooter className="mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.text,text/plain,text/markdown"
          multiple
          hidden
          disabled={isCreating}
          onChange={handleFileInputChange}
          aria-label={m.notes_attachments_attach()}
        />
        <Button type="button" onClick={handleAttachClick} variant="ghost" disabled={isCreating}>
          <PaperclipIcon data-icon="inline-start" />
          {m.notes_attachments_attach()}
        </Button>
        <Button type="button" onClick={onCancel} variant="ghost" disabled={isCreating}>
          {m.notes_page_create_cancel()}
        </Button>
        <Button type="submit" disabled={isCreating || !hasContent}>
          {isCreating ? (
            <Loader2Icon className="animate-spin" data-icon="inline-start" />
          ) : (
            <SaveIcon data-icon="inline-start" />
          )}
          {isCreating ? m.notes_page_create_saving() : m.notes_page_create_save()}
        </Button>
      </DialogFooter>
    </form>
  );
}
