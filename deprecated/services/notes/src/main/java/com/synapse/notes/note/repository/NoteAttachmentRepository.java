package com.synapse.notes.note.repository;

import com.synapse.notes.note.model.NoteAttachment;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

public interface NoteAttachmentRepository extends JpaRepository<NoteAttachment, UUID> {

  List<NoteAttachment> findByNote_IdAndUserId(
      @Param("noteId") UUID noteId, @Param("userId") String userId);

  long countByNote_IdAndUserId(@Param("noteId") UUID noteId, @Param("userId") String userId);

  Optional<NoteAttachment> findByIdAndUserId(UUID id, String userId);

  void deleteByNote_IdInAndUserId(
      @Param("noteIds") Collection<UUID> noteIds, @Param("userId") String userId);
}
