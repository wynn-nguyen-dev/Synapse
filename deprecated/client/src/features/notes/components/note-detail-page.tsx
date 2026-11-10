import { useCallback, useEffect } from 'react';
import { Controller } from 'react-hook-form';

import { getRouteApi, useNavigate, useParams } from '@tanstack/react-router';

import { toast } from 'sonner';

import { useShortcut } from '@/hooks/use-shortcut';

import {
  buildNoteChatAttachment,
  useChatNoteAttachmentStore,
} from '@/store/chat-note-attachment-store';
import { useCompanionContextStore } from '@/store/companion-context-store';

import { m } from '@/paraglide/messages';

import { KeyCombo, MarkdownRenderer } from '@/components/shared';
import { LexicalEditor } from '@/components/shared/editor';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  ArrowLeftIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  Edit3Icon,
  EyeIcon,
  MessagesSquareIcon,
  MoreHorizontalIcon,
  RotateCcwIcon,
  SaveIcon,
  Trash2Icon,
  XCircleIcon,
} from 'lucide-react';

import EnrichSuggestionBar from '@/features/notes/components/enrich-suggestion-bar';
import { getMarkdownReadTimeSync, exportMarkdown } from '@/features/notes/service';
import RelatedNotesPanel from '@/features/notes/components/related-notes-panel';
import BacklinksSection from '@/features/notes/components/backlinks-section';
import NoteTagEditor from '@/features/notes/components/note-tag-editor';
import { useNoteTags } from '@/features/notes/hooks/use-note-tags';
import { getNotesClient } from '@/features/notes/api/notes.http';
import { useGoToCompanion } from '@/features/companion/hooks';
import { useNoteDetails } from '@/features/notes/hooks';

const Route = getRouteApi('/_app/notes/$noteId');

export function NoteDetailPage() {
  const initialData = Route.useLoaderData();
  const { actions, status, state, form, note } = useNoteDetails(initialData);

  const { watchedContent, watchedTitle, activeTab } = state;
  const {
    formState: { isDirty },
    control,
  } = form;
  const {
    deleteNotePermanently,
    backToNotesPage,
    moveNoteToTrash,
    setActiveTab,
    restoreNote,
    saveChanges,
    copyContent,
  } = actions;
  const { isRestoring, isDeleting, isTrashing, isUpdating } = status;

  const { noteId } = useParams({ from: '/_app/notes/$noteId' });
  const navigate = useNavigate();
  const { state: tagState, actions: tagActions } = useNoteTags(noteId, note.tags ?? []);
  const { combos: enrichCombos } = useShortcut('enrich-note');
  const setActiveDocument = useCompanionContextStore((state) => state.setActiveDocument);
  const addNoteAttachment = useChatNoteAttachmentStore((state) => state.add);
  const goToCompanion = useGoToCompanion();

  const includeInChat = () => {
    const added = addNoteAttachment(
      buildNoteChatAttachment({
        content: watchedContent,
        title: watchedTitle,
        id: noteId,
      }),
    );
    if (!added) {
      toast.error(m.chat_attachments_max());
      return;
    }
    goToCompanion();
  };

  const resolveWikilink = useCallback(
    async (title: string) => {
      try {
        const page = await getNotesClient({
          query: { q: title, pageSize: 1, page: 1, sort: ['updatedAt,desc'] },
        });
        const [match] = page.items;
        if (!match) {
          toast.error(m.notes_wikilink_not_found({ title }));
          return;
        }
        void navigate({ to: '/notes/$noteId', params: { noteId: match.id } });
      } catch {
        toast.error(m.notes_ask_failed(), {
          description: m.common_error_connection(),
        });
      }
    },
    [navigate],
  );

  const handleWikilinkClick = useCallback(
    (title: string) => {
      void resolveWikilink(title);
    },
    [resolveWikilink],
  );

  const isTrashed = note.trashed;
  const isBusy = isUpdating || isDeleting || isTrashing || isRestoring;

  useEffect(() => {
    setActiveDocument({
      content: watchedContent,
      title: watchedTitle,
      id: noteId,
    });

    return () => setActiveDocument(null);
  }, [noteId, watchedTitle, watchedContent, setActiveDocument]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void saveChanges(event);
      }}
      className="h-full"
    >
      <Tabs
        defaultValue="preview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full flex-col"
      >
        <div className="flex h-full flex-col @container/page-header">
          <div className="flex items-center justify-between border-b border-border/40 bg-background/80 px-4 md:px-8 py-2.5 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={backToNotesPage}
                className="rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60"
              >
                <ArrowLeftIcon className="size-4" />
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isBusy || !isDirty}
                className="h-8 gap-1.5 text-xs font-semibold rounded-md"
              >
                <SaveIcon className="size-3.5" />
                {isUpdating ? m.notes_page_edit_saving() : m.notes_page_edit_save_short()}
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden @2xl/page-header:flex text-[11px] font-medium text-muted-foreground items-center gap-1 px-2 py-1 rounded-md">
                <ClockIcon className="size-3" />
                {getMarkdownReadTimeSync(watchedContent)}
              </span>

              <TabsList className="h-8 p-0.5" variant="line">
                <TabsTrigger
                  value="edit"
                  className="h-7 text-xs px-3 gap-1.5 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  disabled={isBusy}
                >
                  <Edit3Icon className="size-3.5" />
                  {m.notes_page_edit_tab_edit()}
                </TabsTrigger>

                <TabsTrigger
                  value="preview"
                  className="h-7 text-xs px-3 gap-1.5 rounded-md font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  disabled={isBusy}
                >
                  <EyeIcon className="size-3.5" />
                  {m.notes_page_edit_preview()}
                </TabsTrigger>
              </TabsList>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" className="rounded-lg" disabled={isBusy}>
                      <MoreHorizontalIcon className="size-4" />
                    </Button>
                  }
                />

                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={includeInChat} className="cursor-pointer">
                    <MessagesSquareIcon className="size-4 mr-2 text-violet-400 dark:text-violet-600" />
                    <span>{m.notes_page_include_in_chat()}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => void copyContent(watchedContent)}
                    className="cursor-pointer"
                  >
                    <CopyIcon className="size-4 mr-2" />
                    <span>{m.notes_page_card_copy_content()}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      exportMarkdown({
                        ...note,
                        title: watchedTitle,
                        content: watchedContent,
                      })
                    }
                    className="cursor-pointer"
                  >
                    <DownloadIcon className="size-4 mr-2" />
                    <span>{m.notes_page_export_markdown()}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {isTrashed ? (
                    <DropdownMenuItem onClick={restoreNote} className="cursor-pointer">
                      <RotateCcwIcon className="size-4 mr-2" />
                      <span>{m.notes_card_restore()}</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={moveNoteToTrash} className="cursor-pointer">
                      <Trash2Icon className="size-4 mr-2" />
                      <span>{m.notes_page_action_trash()}</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => void deleteNotePermanently()}
                    variant="destructive"
                    className="cursor-pointer"
                  >
                    <XCircleIcon className="size-4 mr-2" />
                    <span>{m.notes_card_delete_permanent()}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-5xl px-6 py-8 md:py-12 space-y-4">
                {!isTrashed && (
                  <EnrichSuggestionBar
                    noteId={noteId}
                    content={watchedContent}
                    isTrashed={isTrashed}
                    onTagsChange={tagActions.setTags}
                    onApplyTitle={(title) =>
                      form.setValue('title', title, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    onAppendContent={(block) =>
                      form.setValue('content', `${watchedContent}\n\n${block}`, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                )}

                {!isTrashed && (
                  <NoteTagEditor
                    key={noteId}
                    noteId={noteId}
                    tags={tagState.tags}
                    onTagsChange={tagActions.setTags}
                  />
                )}

                <RelatedNotesPanel noteId={noteId} />

                <BacklinksSection noteId={noteId} />

                <TabsContent value="edit" className="m-0 focus-visible:outline-none min-h-125">
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder={m.notes_page_untitled_placeholder()}
                        className="w-full resize-none bg-transparent text-3xl md:text-4xl font-extrabold tracking-tight outline-none placeholder:text-muted-foreground/30 text-foreground border-none focus:ring-0 shadow-none py-7 px-0"
                        disabled={isBusy}
                      />
                    )}
                  />

                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <LexicalEditor
                        value={field.value}
                        onChange={field.onChange}
                        className="h-full max-h-120"
                        disabled={isBusy}
                        placeholder={m.notes_page_lexical_placeholder()}
                      />
                    )}
                  />

                  {!isTrashed && !watchedContent.trim() && (
                    <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground/70">
                      {m.notes_enrich_hint()}
                      <KeyCombo combo={enrichCombos[0] ?? ''} />
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="m-0 focus-visible:outline-none min-h-125">
                  <FieldLabel className="w-full resize-none bg-transparent text-3xl md:text-4xl font-extrabold tracking-tight outline-none placeholder:text-muted-foreground/30 text-foreground border-none focus:ring-0 shadow-none py-7 px-0 select-text">
                    {watchedTitle}
                  </FieldLabel>

                  <div className="border border-border/80 rounded-xl bg-background flex flex-col focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 px-5 py-5 h-full max-h-120 overflow-y-auto">
                    <MarkdownRenderer
                      className="h-full"
                      content={watchedContent || m.notes_page_empty_preview_fallback()}
                      onWikilinkClick={handleWikilinkClick}
                    />
                  </div>
                </TabsContent>
              </div>
            </div>
          </div>
        </div>
      </Tabs>
    </form>
  );
}
