package com.synapse.notes.note.dto.response;

import com.synapse.notes.note.model.Note;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record NoteResponse(
    UUID id,
    String userId,
    String title,
    String content,
    boolean pinned,
    boolean favorite,
    boolean archived,
    boolean trashed,
    Instant trashedAt,
    Instant createdAt,
    Instant updatedAt,
    List<String> tags,
    Integer sortOrder,
    List<AttachmentMeta> attachments) {

  public static NoteResponse from(Note note) {
    List<String> tags = note.getTags() == null ? List.of() : List.copyOf(note.getTags());
    List<AttachmentMeta> attachments =
        note.getAttachments() == null
            ? List.of()
            : note.getAttachments().stream().map(AttachmentMeta::from).toList();
    return new NoteResponse(
        note.getId(),
        note.getUserId(),
        note.getTitle(),
        note.getContent(),
        note.isPinned(),
        note.isFavorite(),
        note.isArchived(),
        note.isTrashed(),
        note.getTrashedAt(),
        note.getCreatedAt(),
        note.getUpdatedAt(),
        tags,
        note.getSortOrder(),
        attachments);
  }
}
