import type { AttachedFile } from '@/features/notes/hooks/use-note-create';
import type { NoteFormInput } from '@/features/notes/schemas';
import type { ChangeEvent, KeyboardEvent } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { Controller } from 'react-hook-form';
import { useRef } from 'react';

import { toast } from 'sonner';

import { m } from '@/paraglide/messages';

import { LexicalEditor } from '@/components/shared/editor';

import { Field, FieldError } from '@/components/ui/field';
import { DialogFooter } from '@/components/ui/dialog';
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

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
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
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Ctrl+Enter save lives on the form because the Lexical contentEditable traps Enter; all inner controls stay keyboard-accessible
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
      onKeyDown={handleFormKeyDown}
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
            <div
              onPasteCapture={(event) => {
                const text = event.clipboardData.getData('text');
                if (!shouldConvertPasteToFile(text)) return;
                event.preventDefault();
                event.stopPropagation();
                attachments.onAttach([createPastedFile(text)]);
                if (!field.value.trim()) {
                  field.onChange(extractLeadLine(text));
                }
                toast.success(m.notes_attachments_pasted_file());
              }}
            >
              <LexicalEditor
                value={field.value}
                onChange={field.onChange}
                disabled={isCreating}
                placeholder={m.notes_page_create_content_placeholder()}
              />
            </div>

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
