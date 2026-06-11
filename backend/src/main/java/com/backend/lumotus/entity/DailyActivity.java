package com.backend.lumotus.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "daily_activity")
@Getter
@Setter
@NoArgsConstructor
public class DailyActivity {

    @EmbeddedId
    private DailyActivityId id;

    @Column(name = "cards_reviewed", nullable = false)
    private int cardsReviewed = 0;

    @Column(name = "quiz_taken", nullable = false)
    private int quizTaken = 0;

    @Column(name = "xp_earned", nullable = false)
    private int xpEarned = 0;

    @Column(name = "study_minutes", nullable = false)
    private int studyMinutes = 0;

    public DailyActivity(UUID userId, LocalDate activityDate) {
        this.id = new DailyActivityId(userId, activityDate);
    }
}
