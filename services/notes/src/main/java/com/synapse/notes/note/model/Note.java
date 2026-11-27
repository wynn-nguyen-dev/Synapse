package com.synapse.notes.note.model;

import com.synapse.notes.common.exception.ApiException;
import com.synapse.notes.common.exception.ErrorCode;
import com.synapse.notes.note.dto.request.NoteStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

@Entity
@Table(name = "notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Note {
  public static final int MAX_CONTENT_LENGTH = 1500;
  public static final int MAX_TITLE_LENGTH = 200;
  public static final int MAX_TAGS = 20;
  public static final int MAX_TAG_LENGTH = 50;

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private String userId;

  @Column
  @Size(max = MAX_TITLE_LENGTH)
  private String title;

  @Column(nullable = false, columnDefinition = "TEXT")
  @NotBlank
  @Size(max = MAX_CONTENT_LENGTH)
  private String content;

  @Builder.Default
  @Column(nullable = false)
  private boolean pinned = false;

  @Builder.Default
  @Column(nullable = false)
  private boolean favorite = false;

  @Builder.Default
  @Column(nullable = false)
  private boolean archived = false;

  @Builder.Default
  @Column(nullable = false)
  private boolean trashed = false;

  private Instant trashedAt;

  @ElementCollection(fetch = FetchType.LAZY)
  @CollectionTable(name = "note_tags", joinColumns = @JoinColumn(name = "note_id"))
  @Column(name = "tag", nullable = false, length = 50)
  @Fetch(FetchMode.SUBSELECT)
  @Builder.Default
  private List<String> tags = new ArrayList<>();

  @Column(name = "sort_order")
  private Integer sortOrder;

  @OneToMany(
      mappedBy = "note",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  @Fetch(FetchMode.SUBSELECT)
  @Builder.Default
  private List<NoteAttachment> attachments = new ArrayList<>();

  @Builder.Default
  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  @Builder.Default
  @Column(nullable = false)
  private Instant updatedAt = Instant.now();

  public void updateContent(String title, String content) {
    this.title = title;
    this.content = content;
    this.updatedAt = Instant.now();
  }

  public void replaceTags(List<String> tags) {
    List<String> clean =
        tags == null
            ? List.of()
            : tags.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.length() > MAX_TAG_LENGTH ? s.substring(0, MAX_TAG_LENGTH) : s)
                .distinct()
                .sorted()
                .limit(MAX_TAGS)
                .toList();
    this.tags = new ArrayList<>(clean);
    this.updatedAt = Instant.now();
  }

  public void setPinned(boolean pinned) {
    if (pinned) {
      if (this.trashed) {
        throw new ApiException(ErrorCode.NOTE_CANNOT_PIN_TRASHED);
      }
      if (this.archived) {
        throw new ApiException(ErrorCode.NOTE_CANNOT_PIN_ARCHIVED);
      }
    }

    this.pinned = pinned;
    this.updatedAt = Instant.now();
  }

  public void setFavorite(boolean favorite) {
    this.favorite = favorite;
    this.updatedAt = Instant.now();
  }

  public void changeStatus(NoteStatus status) {
    if (status == null) return;

    switch (status) {
      case ACTIVE -> {
        this.archived = false;
        this.trashed = false;
        this.trashedAt = null;
      }
      case ARCHIVED -> {
        this.archived = true;
        this.trashed = false;
        this.trashedAt = null;
        this.pinned = false;
      }
      case TRASHED -> {
        this.trashed = true;
        this.trashedAt = Instant.now();
        this.archived = false;
        this.pinned = false;
      }
    }
    this.updatedAt = Instant.now();
  }
}
