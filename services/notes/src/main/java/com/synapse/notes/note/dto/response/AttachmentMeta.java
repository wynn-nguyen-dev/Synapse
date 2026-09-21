package com.synapse.notes.note.dto.response;

import com.synapse.notes.note.model.NoteAttachment;
import java.time.Instant;
import java.util.UUID;

public record AttachmentMeta(UUID id, String filename, Instant createdAt) {

  public static AttachmentMeta from(NoteAttachment attachment) {
    return new AttachmentMeta(
        attachment.getId(), attachment.getFilename(), attachment.getCreatedAt());
  }
}
