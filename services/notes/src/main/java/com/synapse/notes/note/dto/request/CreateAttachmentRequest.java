package com.synapse.notes.note.dto.request;

import com.synapse.notes.note.model.NoteAttachment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAttachmentRequest(
    @NotBlank(message = "Attachment filename is required")
        @Size(max = NoteAttachment.MAX_FILENAME_LENGTH, message = "Attachment filename is too long")
        String filename,
    @NotBlank(message = "Attachment content is required")
        @Size(
            max = NoteAttachment.MAX_CONTENT_BASE64_LENGTH,
            message = "Attachment content is too large")
        String contentBase64) {}
