package com.backend.lumotus.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_deck_progress")
@Getter
@Setter
@NoArgsConstructor
public class UserDeckProgress {

    @EmbeddedId
    private UserDeckProgressId id;

    @Column(name = "total_cards", nullable = false)
    private int totalCards;

    @Column(name = "learned_cards", nullable = false)
    private int learnedCards = 0;

    @Column(name = "mastered_cards", nullable = false)
    private int masteredCards = 0;

    @Column(name = "last_studied_at")
    private Instant lastStudiedAt;

    @Column(name = "is_copied_from")
    private UUID copiedFrom;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UserDeckProgress(UserDeckProgressId id, int totalCards, UUID copiedFrom) {
        this.id = id;
        this.totalCards = totalCards;
        this.copiedFrom = copiedFrom;
    }
}
