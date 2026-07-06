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
@Table(name = "user_card_review")
@Getter
@Setter
@NoArgsConstructor
public class UserCardReview {

    @EmbeddedId
    private UserCardReviewId id;

    @Column(name = "deck_id", nullable = false)
    private UUID deckId;

    @Column(name = "ease_factor", nullable = false)
    private float easeFactor = 2.5f;

    @Column(name = "interval_days", nullable = false)
    private int intervalDays = 0;

    @Column(nullable = false)
    private int repetitions = 0;

    @Column(name = "next_review_at", nullable = false)
    private Instant nextReviewAt;

    @Column(name = "last_rating", columnDefinition = "SMALLINT")
    private ReviewRating lastRating;

    @Column(name = "is_starred", nullable = false)
    private boolean starred = false;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UserCardReview(UserCardReviewId id, UUID deckId, Instant nextReviewAt) {
        this.id = id;
        this.deckId = deckId;
        this.nextReviewAt = nextReviewAt;
    }
}
