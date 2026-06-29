package com.backend.lumotus.study;

import com.backend.lumotus.entity.StudyMode;
import java.time.Instant;
import java.util.*;

public class StudyAttempt {

    private final UUID attemptId;
    private final UUID userId;
    private final UUID deckId;
    private final StudyMode mode;
    private final Instant startedAt;
    private final Map<String, QuestionState> questions = new HashMap<>();
    private final Map<String, CardInfo> cardInfo = new HashMap<>();
    private boolean finished = false;

    public StudyAttempt(UUID userId, UUID deckId, StudyMode mode) {
        this.attemptId = UUID.randomUUID();
        this.userId = userId;
        this.deckId = deckId;
        this.mode = mode;
        this.startedAt = Instant.now();
    }

    public UUID getAttemptId() { return attemptId; }
    public UUID getUserId() { return userId; }
    public UUID getDeckId() { return deckId; }
    public StudyMode getMode() { return mode; }
    public Instant getStartedAt() { return startedAt; }
    public boolean isFinished() { return finished; }
    public Map<String, CardInfo> getCardInfo() { return cardInfo; }

    public void addQuestion(String questionId, String correctAnswer, CardInfo info) {
        questions.put(questionId, new QuestionState(questionId, correctAnswer));
        if (info != null) cardInfo.put(questionId, info);
    }

    public void addQuestion(String questionId, String correctAnswer) {
        addQuestion(questionId, correctAnswer, null);
    }

    public void recordAnswer(String questionId, String selectedAnswer) {
        QuestionState qs = questions.get(questionId);
        if (qs != null) {
            qs.selectedAnswer = selectedAnswer;
        }
    }

    public boolean isCorrect(String questionId) {
        QuestionState qs = questions.get(questionId);
        if (qs == null || qs.selectedAnswer == null) return false;
        return normalize(qs.selectedAnswer).equals(normalize(qs.correctAnswer));
    }

    public List<QuestionState> getQuestionStates() {
        return new ArrayList<>(questions.values());
    }

    public int getCorrectCount() {
        return (int) questions.values().stream()
                .filter(qs -> qs.selectedAnswer != null
                        && normalize(qs.selectedAnswer).equals(normalize(qs.correctAnswer)))
                .count();
    }

    public int getTotalCount() {
        return questions.size();
    }

    public void finish() {
        this.finished = true;
    }

    public long timeTakenSeconds() {
        return java.time.Duration.between(startedAt, Instant.now()).getSeconds();
    }

    public static String normalize(String text) {
        if (text == null) return "";
        return text.trim().toLowerCase()
                .replaceAll("[\\u2018\\u2019]", "'")
                .replaceAll("[\\u201C\\u201D]", "\"");
    }

    public static class QuestionState {
        public final String questionId;
        public final String correctAnswer;
        public String selectedAnswer;

        public QuestionState(String questionId, String correctAnswer) {
            this.questionId = questionId;
            this.correctAnswer = correctAnswer;
        }
    }

    public record CardInfo(String front, String back, String phonetic, String imageUrl, String audioUrl) {}
}
