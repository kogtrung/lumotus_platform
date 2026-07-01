package com.backend.lumotus.entity;

import com.backend.lumotus.entity.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "quizzes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quiz extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deck_id")
    private Deck deck;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "owner_username", length = 100)
    private String ownerUsername;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private QuizStatus status = QuizStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "quiz_type", nullable = false, length = 20)
    @Builder.Default
    private QuizType quizType = QuizType.GENERATED;

    @Column(name = "is_immutable", nullable = false)
    @Builder.Default
    private Boolean isImmutable = false;

    @Column(name = "time_limit_seconds")
    private Integer timeLimitSeconds;

    @Column(name = "question_count", nullable = false)
    @Builder.Default
    private Integer questionCount = 10;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuizQuestion> questions = new ArrayList<>();

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Integer attemptCount = 0;

    @Column(name = "avg_score")
    private Double avgScore;

    @Column(name = "rejection_note", columnDefinition = "TEXT")
    private String rejectionNote;

    @Column(length = 120)
    private String slug;

    public enum QuizStatus {
        DRAFT,     // user-created, not yet submitted for review
        PENDING,   // submitted, awaiting admin approval
        APPROVED,  // visible in public explore page
        REJECTED   // admin rejected
    }

    public enum QuizType {
        GENERATED,   // from deck (user creates via POST /quizzes)
        IMPORTED     // from CSV (admin uploads via POST /quizzes/admin/import)
    }

    public void addQuestion(QuizQuestion question) {
        questions.add(question);
        question.setQuiz(this);
    }
}
