import { useCallback, useEffect, useState } from 'react';

import { useConfirm } from '@/providers/use-confirm';

import { m } from '@/paraglide/messages';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useNoteCreate } from '@/features/notes/hooks/use-note-create';
import { QUICK_CAPTURE_OPEN_EVENT } from '@/features/notes/constants';
import { useNoteCreatePrefillStore } from '@/features/notes/store';

import QuickCaptureForm from './quick-capture-form';

export default function QuickCaptureDialog() {
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();

  const { actions, form, state, status } = useNoteCreate({
    onCreated: () => setOpen(false),
  });
  const { watchedContent, attachedFiles } = state;
  const { isCreating } = status;

  const hasContent = watchedContent.trim().length > 0 || attachedFiles.length > 0;

  useEffect(() => {
    const handleOpen = () => {
      const prefill = useNoteCreatePrefillStore.getState().consume();
      form.reset({ content: prefill ?? '' });
      setOpen(true);
    };

    window.addEventListener(QUICK_CAPTURE_OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener(QUICK_CAPTURE_OPEN_EVENT, handleOpen);
    };
  }, [form]);

  const confirmDiscard = useCallback(async () => {
    const confirmed = await confirm({
      title: m.notes_quick_capture_discard_title(),
      description: m.notes_quick_capture_discard_desc(),
      confirmText: m.notes_quick_capture_discard_confirm(),
      cancelText: m.notes_page_create_cancel(),
    });
    if (confirmed) {
      setOpen(false);
    }
  }, [confirm]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && hasContent) {
        void confirmDiscard();
        return;
      }
      setOpen(nextOpen);
    },
    [confirmDiscard, hasContent],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.notes_page_create_dialog_title()}</DialogTitle>
          <DialogDescription>{m.notes_page_create_dialog_desc()}</DialogDescription>
        </DialogHeader>

        <QuickCaptureForm
          form={form}
          attachments={{
            files: attachedFiles,
            onAttach: actions.attachFiles,
            onRemove: actions.removeAttachedFile,
          }}
          hasContent={hasContent}
          isCreating={isCreating}
          onCancel={() => handleOpenChange(false)}
          onSave={() => void actions.createNew()}
        />
      </DialogContent>
    </Dialog>
  );
}
