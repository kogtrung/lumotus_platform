package com.backend.lumotus.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;

@Entity
@Table(name = "deck_topics")
@Getter
@Setter
@NoArgsConstructor
public class DeckTopic {

    @EmbeddedId
    private DeckTopicId id;

    @CreatedDate
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt = Instant.now();

    public DeckTopic(DeckTopicId id) {
        this.id = id;
    }
}
