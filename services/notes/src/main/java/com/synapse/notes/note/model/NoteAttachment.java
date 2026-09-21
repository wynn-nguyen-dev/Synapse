package com.synapse.notes.note.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "note_attachments")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteAttachment {
  public static final int MAX_FILENAME_LENGTH = 255;
  public static final int MAX_CONTENT_BASE64_LENGTH = 200000;
  public static final int MAX_PER_NOTE = 10;

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "note_id", nullable = false)
  private Note note;

  @Column(nullable = false)
  private String userId;

  @Column(nullable = false, length = 255)
  private String filename;

  @Column(name = "content_base64", nullable = false, columnDefinition = "TEXT")
  private String contentBase64;

  @Builder.Default
  @Column(nullable = false)
  private Instant createdAt = Instant.now();
}
