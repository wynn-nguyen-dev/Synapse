package com.synapse.notes.note.controller;

import com.synapse.notes.common.annotation.CurrentUserId;
import com.synapse.notes.common.response.ApiResponse;
import com.synapse.notes.note.dto.request.CreateAttachmentRequest;
import com.synapse.notes.note.dto.response.AttachmentResponse;
import com.synapse.notes.note.service.NoteAttachmentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("")
@RequiredArgsConstructor
public class AttachmentController {
  private final NoteAttachmentService attachmentService;

  @PostMapping("/{noteId}/attachments")
  public ApiResponse<AttachmentResponse> add(
      @CurrentUserId String userId,
      @PathVariable UUID noteId,
      @RequestBody @Valid CreateAttachmentRequest req) {
    return ApiResponse.success(attachmentService.addAttachment(userId, noteId, req));
  }

  @GetMapping("/{noteId}/attachments")
  public ApiResponse<List<AttachmentResponse>> list(
      @CurrentUserId String userId, @PathVariable UUID noteId) {
    return ApiResponse.success(attachmentService.listAttachments(userId, noteId));
  }

  @DeleteMapping("/attachments/{attachmentId}")
  public ApiResponse<Object> delete(@CurrentUserId String userId, @PathVariable UUID attachmentId) {
    attachmentService.deleteAttachment(userId, attachmentId);
    return ApiResponse.success(null);
  }
}
