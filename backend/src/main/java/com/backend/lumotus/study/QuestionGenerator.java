package com.backend.lumotus.study;

import com.backend.lumotus.entity.Card;
import com.backend.lumotus.entity.StudyMode;
import com.backend.lumotus.dto.response.QuestionResponse;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class QuestionGenerator {

    private final List<Card> cards;
    private final StudyMode mode;
    private final int count;
    private final String direction;

    public QuestionGenerator(List<Card> cards, StudyMode mode, int count) {
        this(cards, mode, count, "forward");
    }

    public QuestionGenerator(List<Card> cards, StudyMode mode, int count, String direction) {
        this.cards = cards;
        this.mode = mode;
        this.count = count;
        this.direction = direction != null ? direction : "forward";
    }

    public List<QuestionResponse> generate() {
        List<Card> pool = new ArrayList<>(cards);
        Collections.shuffle(pool);
        int size = Math.min(count, pool.size());

        return switch (mode) {
            case FLASHCARD -> generateFlashcard(pool.subList(0, size));
            case QUIZ -> generateQuiz(pool.subList(0, size));
            case LEARN -> generateLearn(pool.subList(0, size));
            case SPELL -> generateSpell(pool.subList(0, size));
        };
    }

    private StudyAttempt.CardInfo cardInfo(Card card) {
        return new StudyAttempt.CardInfo(
                card.getFront(), card.getBack(),
                card.getPhonetic(), card.getImageUrl(), card.getAudioUrl());
    }

    private List<QuestionResponse> generateFlashcard(List<Card> subset) {
        return subset.stream().map(card -> new QuestionResponse(
                card.getId().toString(),
                "FLASHCARD",
                card.getFront(),
                card.getPhonetic(),
                card.getHint(),
                card.getImageUrl(),
                card.getAudioUrl(),
                card.getBack(),
                null,
                cardInfo(card)
        )).toList();
    }

    private List<QuestionResponse> generateQuiz(List<Card> subset) {
        // Collect unique backs from cards that are NOT in the subset
        // This ensures wrong answers come from different cards
        List<String> subsetFronts = subset.stream()
                .map(Card::getFront)
                .map(String::toLowerCase)
                .collect(Collectors.toList());

        List<String> availableBacks = cards.stream()
                .filter(c -> c.getBack() != null && !c.getBack().isBlank())
                .filter(c -> !subsetFronts.contains(c.getFront().toLowerCase()))
                .map(Card::getBack)
                .distinct()
                .collect(Collectors.toList());

        return subset.stream().map(card -> {
            String front = card.getFront();
            String correct = card.getBack();

            // Get wrong options from different cards
            List<String> wrongOptions = new ArrayList<>();

            // First, try to get from cards with completely different fronts
            List<String> distinctBacks = availableBacks.stream()
                    .filter(b -> !b.equalsIgnoreCase(correct))
                    .filter(b -> !b.equalsIgnoreCase(front))
                    .filter(b -> !similarString(b.toLowerCase(), correct.toLowerCase()))
                    .limit(3)
                    .collect(Collectors.toList());

            wrongOptions.addAll(distinctBacks);

            // If not enough, add from any backs that are different enough
            if (wrongOptions.size() < 3) {
                List<String> fallbackBacks = cards.stream()
                        .map(Card::getBack)
                        .filter(b -> b != null && !b.isBlank())
                        .filter(b -> !b.equalsIgnoreCase(correct))
                        .filter(b -> !b.equalsIgnoreCase(front))
                        .filter(b -> !wrongOptions.contains(b))
                        .filter(b -> !similarString(b.toLowerCase(), correct.toLowerCase()))
                        .distinct()
                        .limit(3 - wrongOptions.size())
                        .collect(Collectors.toList());
                wrongOptions.addAll(fallbackBacks);
            }

            // If still not enough, generate placeholder options
            while (wrongOptions.size() < 3) {
                wrongOptions.add("Option " + (wrongOptions.size() + 1));
            }

            // Shuffle wrong options
            Collections.shuffle(wrongOptions);

            // Create options with correct at random position
            List<String> options = new ArrayList<>(wrongOptions);
            options.add(correct);
            Collections.shuffle(options);

            return new QuestionResponse(
                    card.getId().toString(),
                    "QUIZ",
                    front,
                    card.getPhonetic(),
                    card.getHint(),
                    card.getImageUrl(),
                    card.getAudioUrl(),
                    correct,
                    options,
                    cardInfo(card)
            );
        }).toList();
    }

    private List<QuestionResponse> generateLearn(List<Card> subset) {
        boolean isReverse = "reverse".equals(direction);

        return subset.stream().map(card -> {
            // For reverse: front becomes back (question) and back becomes front (answer)
            String question = isReverse ? card.getBack() : card.getFront();
            String answer = isReverse ? card.getFront() : card.getBack();

            return new QuestionResponse(
                    card.getId().toString(),
                    "LEARN",
                    question,
                    card.getPhonetic(),
                    card.getHint(),
                    card.getImageUrl(),
                    card.getAudioUrl(),
                    answer,
                    null,
                    cardInfo(card)
            );
        }).toList();
    }

    private List<QuestionResponse> generateSpell(List<Card> subset) {
        List<Card> pool = subset.stream()
                .filter(c -> c.getAudioUrl() != null && !c.getAudioUrl().isBlank())
                .toList();
        if (pool.isEmpty()) pool = subset;
        if (pool.isEmpty()) return List.of();

        return pool.stream().map(card -> new QuestionResponse(
                card.getId().toString(),
                "SPELL",
                card.getFront(),
                card.getPhonetic(),
                card.getHint(),
                card.getImageUrl(),
                card.getAudioUrl(),
                card.getFront(),
                null,
                cardInfo(card)
        )).toList();
    }

    /**
     * Check if two strings are too similar (simple Levenshtein-based check)
     */
    private boolean similarString(String a, String b) {
        if (a.equals(b)) return true;
        if (Math.abs(a.length() - b.length()) > 5) return false;

        int distance = levenshteinDistance(a, b);
        int maxLen = Math.max(a.length(), b.length());
        double similarity = 1.0 - (double) distance / maxLen;

        // Consider similar if more than 70% the same
        return similarity > 0.7;
    }

    private int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];

        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;

        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j], Math.min(dp[i][j - 1], dp[i - 1][j - 1]));
                }
            }
        }

        return dp[a.length()][b.length()];
    }
}
