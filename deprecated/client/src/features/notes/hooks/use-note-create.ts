import type { NoteFormInput, NoteInputPayload } from '@/features/notes/schemas';
import type { CreateNoteResponse } from '@/features/notes/api/notes.http';

import { useForm, useWatch } from 'react-hook-form';
import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

import { m } from '@/paraglide/messages';

import { createAttachmentClient, createNoteClient } from '@/features/notes/api/notes.http';
import { fileToBase64 } from '@/features/notes/attachments';
import { noteInputSchema } from '@/features/notes/schemas';
import { noteKeys } from '@/features/notes/api/notes.api';

interface UseNoteCreateOptions {
  onCreated?: () => void;
}

export interface AttachedFile {
  file: File;
  id: string;
}

export function useNoteCreate(options: UseNoteCreateOptions = {}) {
  const { onCreated } = options;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm<NoteFormInput>({
    resolver: standardSchemaResolver(noteInputSchema),
    defaultValues: {
      content: '',
    },
  });

  const { handleSubmit, control } = form;

  const [attachedFiles, setAttachedFiles] = useState<Array<AttachedFile>>([]);

  const [watchedContent] = useWatch({
    name: ['content'],
    control,
  });

  const { isPending: isCreating, mutate: _createNote } = useMutation<
    CreateNoteResponse,
    Error,
    { files: Array<AttachedFile>; body: NoteInputPayload }
  >({
    onSuccess: ({ title, id }, variables) => {
      const pendingFiles = variables.files;
      setAttachedFiles([]);

      const finish = () => {
        void queryClient.invalidateQueries({ queryKey: noteKeys.all });

        toast.success(m.notes_page_toast_created(), {
          description: m.notes_page_toast_created_desc({ title }),
        });

        onCreated?.();

        void navigate({ params: { noteId: id }, to: '/notes/$noteId', replace: true });
      };

      if (pendingFiles.length === 0) {
        finish();
        return;
      }

      void (async () => {
        try {
          await Promise.all(
            pendingFiles.map(async ({ file }) => {
              const contentBase64 = await fileToBase64(file);
              await createAttachmentClient({
                params: { id },
                body: { filename: file.name, contentBase64 },
              });
            }),
          );
        } catch {
          toast.error(m.notes_attachments_failed(), {
            description: m.common_error_connection(),
          });
        }
        finish();
      })();
    },
    onError: () => {
      toast.error(m.notes_page_toast_create_failed(), {
        description: m.common_error_connection(),
      });
    },
    mutationFn: ({ body }) => createNoteClient({ body }),
  });

  // 3. Handlers
  const createNote = (data: NoteInputPayload) => {
    _createNote({ body: data, files: attachedFiles });
  };

  const attachFiles = (files: Array<File>) => {
    setAttachedFiles((prev) => [...prev, ...files.map((file) => ({ file, id: nanoid() }))]);
  };

  const removeAttachedFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((entry) => entry.id !== id));
  };

  return {
    actions: {
      createNew: handleSubmit(createNote),
      createNote,
      attachFiles,
      removeAttachedFile,
    },
    status: {
      isCreating,
    },
    state: {
      watchedContent,
      attachedFiles,
    },
    form,
  };
}
