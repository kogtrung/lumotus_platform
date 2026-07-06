package com.backend.lumotus.entity;

import com.backend.lumotus.entity.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttempt extends BaseEntity {

    @Version
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;

    @Column(name = "score", nullable = false)
    @Builder.Default
    private Double score = 0.0;

    @Column(name = "total_questions", nullable = false)
    @Builder.Default
    private Integer totalQuestions = 0;

    @Column(name = "correct_answers", nullable = false)
    @Builder.Default
    private Integer correctAnswers = 0;

    @Column(name = "skipped_answers", nullable = false)
    @Builder.Default
    private Integer skippedAnswers = 0;

    @Column(name = "xp_earned", nullable = false)
    @Builder.Default
    private Integer xpEarned = 0;

    @Column(name = "time_taken_seconds")
    private Integer timeTakenSeconds;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuizAnswer> answers = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = Instant.now();
        }
    }

    public void addAnswer(QuizAnswer answer) {
        answers.add(answer);
        answer.setAttempt(this);
    }

    public void finish() {
        this.finishedAt = Instant.now();
        this.status = AttemptStatus.COMPLETED;
        if (startedAt != null) {
            this.timeTakenSeconds = (int) java.time.Duration.between(startedAt, finishedAt).getSeconds();
        }
    }

    public void abandon() {
        this.finishedAt = Instant.now();
        this.status = AttemptStatus.ABANDONED;
        if (startedAt != null) {
            this.timeTakenSeconds = (int) java.time.Duration.between(startedAt, finishedAt).getSeconds();
        }
    }

    public enum AttemptStatus {
        IN_PROGRESS,
        COMPLETED,
        ABANDONED
    }
}
