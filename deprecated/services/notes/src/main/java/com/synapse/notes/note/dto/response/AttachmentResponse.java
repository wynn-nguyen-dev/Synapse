package com.synapse.notes.note.dto.response;

import com.synapse.notes.note.model.NoteAttachment;
import java.time.Instant;
import java.util.UUID;

public record AttachmentResponse(
    UUID id, UUID noteId, String filename, String contentBase64, Instant createdAt) {

  public static AttachmentResponse from(NoteAttachment attachment) {
    return new AttachmentResponse(
        attachment.getId(),
        attachment.getNote().getId(),
        attachment.getFilename(),
        attachment.getContentBase64(),
        attachment.getCreatedAt());
  }
}
