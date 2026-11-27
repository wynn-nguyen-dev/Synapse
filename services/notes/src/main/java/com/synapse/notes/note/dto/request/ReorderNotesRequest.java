package com.synapse.notes.note.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record ReorderNotesRequest(
    @NotEmpty(message = "Reorder requires at least one note ID")
        @Size(max = 100, message = "Reorder supports at most 100 notes at a time")
        List<@NotNull UUID> noteIds) {}
