package com.synapse.notes.note.service;

import com.synapse.notes.common.exception.ApiException;
import com.synapse.notes.common.exception.ErrorCode;
import com.synapse.notes.note.dto.request.CreateAttachmentRequest;
import com.synapse.notes.note.dto.response.AttachmentResponse;
import com.synapse.notes.note.event.NoteEventPublisher;
import com.synapse.notes.note.model.Note;
import com.synapse.notes.note.model.NoteAttachment;
import com.synapse.notes.note.repository.NoteAttachmentRepository;
import com.synapse.notes.note.repository.NoteRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoteAttachmentService {
  private final NoteAttachmentRepository attachmentRepository;
  private final NoteRepository noteRepository;
  private final NoteEventPublisher eventPublisher;

  public List<AttachmentResponse> listAttachments(String userId, UUID noteId) {
    getNoteEntity(userId, noteId);
    return attachmentRepository.findByNote_IdAndUserId(noteId, userId).stream()
        .map(AttachmentResponse::from)
        .toList();
  }

  @Transactional
  public AttachmentResponse addAttachment(String userId, UUID noteId, CreateAttachmentRequest req) {
    Note note = getNoteEntity(userId, noteId);

    if (attachmentRepository.countByNote_IdAndUserId(noteId, userId)
        >= NoteAttachment.MAX_PER_NOTE) {
      throw new ApiException(ErrorCode.VALIDATION_ERROR, "Too many attachments on this note");
    }

    NoteAttachment saved =
        attachmentRepository.save(
            NoteAttachment.builder()
                .note(note)
                .userId(userId)
                .filename(req.filename().trim())
                .contentBase64(req.contentBase64())
                .build());
    note.getAttachments().add(saved);

    eventPublisher.publishUpdated(note);
    return AttachmentResponse.from(saved);
  }

  @Transactional
  public void deleteAttachment(String userId, UUID attachmentId) {
    NoteAttachment attachment =
        attachmentRepository
            .findByIdAndUserId(attachmentId, userId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOTE_NOT_FOUND, "Attachment not found"));

    Note note = getNoteEntity(userId, attachment.getNote().getId());
    boolean removed = note.getAttachments().removeIf(a -> a.getId().equals(attachment.getId()));
    if (!removed) {
      throw new ApiException(ErrorCode.NOTE_NOT_FOUND, "Attachment not found");
    }

    eventPublisher.publishUpdated(note);
  }

  private Note getNoteEntity(String userId, UUID noteId) {
    return noteRepository
        .findByIdAndUserId(noteId, userId)
        .orElseThrow(() -> new ApiException(ErrorCode.NOTE_NOT_FOUND, "Note not found"));
  }
}
