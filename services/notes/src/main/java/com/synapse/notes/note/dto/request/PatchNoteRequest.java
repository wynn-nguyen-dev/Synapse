package com.synapse.notes.note.dto.request;

import com.synapse.notes.note.model.Note;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PatchNoteRequest(
    Boolean pinned,
    Boolean favorite,
    NoteStatus status,
    @Size(max = Note.MAX_TAGS, message = "Too many tags")
        List<@Size(max = Note.MAX_TAG_LENGTH) String> tags) {}
