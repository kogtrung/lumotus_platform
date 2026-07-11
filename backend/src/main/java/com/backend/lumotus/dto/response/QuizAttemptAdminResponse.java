package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.QuizAttempt;
import lombok.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttemptAdminResponse {
    private UUID id;
    private UUID userId;
    private String username;
    private String avatarUrl;
    private UUID quizId;
    private String quizTitle;
    private String quizSlug;
    private String status;
    private Double score;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer skippedAnswers;
    private Integer xpEarned;
    private Integer timeTakenSeconds;
    private Instant startedAt;
    private Instant finishedAt;
    private List<QuizAnswerDetail> answers;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizAnswerDetail {
        private UUID id;
        private UUID questionId;
        private String questionText;
        private String userAnswer;
        private String correctAnswer;
        private boolean correct;
    }

    public static QuizAttemptAdminResponse from(QuizAttempt attempt) {
        List<QuizAnswerDetail> answerDetails = null;
        if (attempt.getAnswers() != null && !attempt.getAnswers().isEmpty()) {
            answerDetails = attempt.getAnswers().stream()
                    .map(a -> QuizAnswerDetail.builder()
                            .id(a.getId())
                            .questionId(a.getQuestion() != null ? a.getQuestion().getId() : null)
                            .questionText(a.getQuestion() != null ? a.getQuestion().getQuestionText() : null)
                            .userAnswer(a.getSelectedAnswer())
                            .correctAnswer(a.getQuestion() != null ? a.getQuestion().getCorrectAnswer() : null)
                            .correct(a.getIsCorrect() != null && a.getIsCorrect())
                            .build())
                    .collect(Collectors.toList());
        }

        return QuizAttemptAdminResponse.builder()
                .id(attempt.getId())
                .userId(attempt.getUser() != null ? attempt.getUser().getId() : null)
                .username(attempt.getUser() != null ? attempt.getUser().getUsername() : null)
                .avatarUrl(attempt.getUser() != null ? attempt.getUser().getAvatarUrl() : null)
                .quizId(attempt.getQuiz() != null ? attempt.getQuiz().getId() : null)
                .quizTitle(attempt.getQuiz() != null ? attempt.getQuiz().getTitle() : null)
                .quizSlug(attempt.getQuiz() != null ? attempt.getQuiz().getSlug() : null)
                .status(attempt.getStatus() != null ? attempt.getStatus().name() : null)
                .score(attempt.getScore())
                .totalQuestions(attempt.getTotalQuestions())
                .correctAnswers(attempt.getCorrectAnswers())
                .skippedAnswers(attempt.getSkippedAnswers())
                .xpEarned(attempt.getXpEarned())
                .timeTakenSeconds(attempt.getTimeTakenSeconds())
                .startedAt(attempt.getStartedAt())
                .finishedAt(attempt.getFinishedAt())
                .answers(answerDetails)
                .build();
    }
}
