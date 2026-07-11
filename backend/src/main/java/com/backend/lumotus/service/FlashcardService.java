package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.BatchRateRequest;
import com.backend.lumotus.dto.request.RateReviewRequest;
import com.backend.lumotus.dto.request.StarReviewRequest;
import com.backend.lumotus.dto.request.StartStudyRequest;
import com.backend.lumotus.dto.request.SubmitStudyRequest;
import com.backend.lumotus.dto.response.DeckProgressResponse;
import com.backend.lumotus.dto.response.DueCardResponse;
import com.backend.lumotus.dto.response.DueCardsResponse;
import com.backend.lumotus.dto.response.QuestionResponse;
import com.backend.lumotus.dto.response.BatchRateResponse;
import com.backend.lumotus.dto.response.RateReviewResponse;
import com.backend.lumotus.dto.response.StarReviewResponse;
import com.backend.lumotus.dto.response.StartStudyResponse;
import com.backend.lumotus.dto.response.StudyResultResponse;
import com.backend.lumotus.dto.response.AnswerDetail;
import com.backend.lumotus.entity.Card;
import com.backend.lumotus.entity.DailyActivity;
import com.backend.lumotus.entity.Deck;
import com.backend.lumotus.entity.ReviewRating;
import com.backend.lumotus.entity.StudyMode;
import com.backend.lumotus.entity.User;
import com.backend.lumotus.entity.UserCardReview;
import com.backend.lumotus.entity.UserCardReviewId;
import com.backend.lumotus.entity.UserDeckProgress;
import com.backend.lumotus.entity.UserDeckProgressId;
import com.backend.lumotus.exception.BadRequestException;
import com.backend.lumotus.exception.ForbiddenException;
import com.backend.lumotus.exception.ResourceNotFoundException;
import com.backend.lumotus.repository.CardRepository;
import com.backend.lumotus.repository.DailyActivityRepository;
import com.backend.lumotus.repository.DeckRepository;
import com.backend.lumotus.repository.UserCardReviewRepository;
import com.backend.lumotus.repository.UserDeckProgressRepository;
import com.backend.lumotus.repository.UserRepository;
import com.backend.lumotus.config.AppProperties;
import com.backend.lumotus.config.Sm2Properties;
import com.backend.lumotus.review.Sm2Algorithm;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.study.QuestionGenerator;
import com.backend.lumotus.study.StudyAttempt;
import com.backend.lumotus.util.SlugUtils;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class FlashcardService {

    private static final int DEFAULT_DUE_LIMIT = 50;

    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final UserCardReviewRepository reviewRepository;
    private final UserDeckProgressRepository progressRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final UserRepository userRepository;
    private final StreakService streakService;
    private final LeaderboardService leaderboardService;

    private final Map<UUID, StudyAttempt> activeAttempts = new ConcurrentHashMap<>();

    private final Sm2Properties sm2Properties;

    // ============================================================
    // STUDY SESSION
    // ============================================================

    @Transactional(readOnly = true)
    public StartStudyResponse startFlashcard(UserPrincipal principal, String deckRef, StartStudyRequest request) {
        if (request.mode() != StudyMode.FLASHCARD) {
            throw new BadRequestException("Only FLASHCARD mode is supported in FlashcardService");
        }

        UUID userId = principal.getId();
        Deck deck = resolveAccessibleDeck(deckRef, userId);

        List<Card> allCards = cardRepository.findByDeckIdOrderBySortOrderAsc(deck.getId());
        if (allCards.isEmpty()) {
            throw new BadRequestException("Deck has no cards");
        }

        StudyAttempt attempt = new StudyAttempt(userId, deck.getId(), StudyMode.FLASHCARD);
        List<QuestionResponse> questions = new QuestionGenerator(allCards, StudyMode.FLASHCARD).generate();

        for (QuestionResponse q : questions) {
            attempt.addQuestion(q.questionId(), q.correctAnswer(), q.cardInfo());
        }

        activeAttempts.put(attempt.getAttemptId(), attempt);

        return new StartStudyResponse(
                attempt.getAttemptId().toString(),
                StudyMode.FLASHCARD,
                deck.getTitle(),
                allCards.size(),
                questions
        );
    }

    @Transactional
    public StudyResultResponse submitFlashcard(UUID attemptId, SubmitStudyRequest request, UserPrincipal principal) {
        StudyAttempt attempt = activeAttempts.remove(attemptId);
        if (attempt == null) {
            throw new ResourceNotFoundException("Flashcard session not found or already submitted");
        }
        if (!attempt.getUserId().equals(principal.getId())) {
            throw new ResourceNotFoundException("Flashcard session not found");
        }
        if (attempt.getMode() != StudyMode.FLASHCARD) {
            throw new BadRequestException("Invalid session type");
        }

        for (SubmitStudyRequest.Answer ans : request.answers()) {
            attempt.recordAnswer(ans.questionId(), ans.selectedAnswer());
        }

        attempt.finish();
        upsertDailyActivity(principal.getId(), 0, attempt.getTotalCount());
        return buildResult(attempt);
    }

    public StudyResultResponse getFlashcardResult(UUID attemptId, UserPrincipal principal) {
        StudyAttempt attempt = activeAttempts.get(attemptId);
        if (attempt == null) {
            throw new ResourceNotFoundException("Flashcard session not found");
        }
        if (!attempt.getUserId().equals(principal.getId())) {
            throw new ResourceNotFoundException("Flashcard session not found");
        }
        return buildResult(attempt);
    }

    private StudyResultResponse buildResult(StudyAttempt attempt) {
        int correct = attempt.getCorrectCount();
        int total = attempt.getTotalCount();
        List<AnswerDetail> details = buildDetails(attempt);

        return new StudyResultResponse(
                attempt.getAttemptId().toString(),
                attempt.getMode(),
                0.0,
                correct,
                total,
                0,
                attempt.timeTakenSeconds(),
                details
        );
    }

    private List<AnswerDetail> buildDetails(StudyAttempt attempt) {
        return attempt.getQuestionStates().stream().map(qs -> {
            StudyAttempt.CardInfo info = attempt.getCardInfo().get(qs.questionId);
            String front = info != null ? info.front() : "";
            return new AnswerDetail(
                    qs.questionId,
                    front,
                    qs.correctAnswer,
                    qs.selectedAnswer != null ? qs.selectedAnswer : "",
                    attempt.isCorrect(qs.questionId)
            );
        }).toList();
    }

    // ============================================================
    // SRS REVIEW
    // ============================================================

    @Transactional(readOnly = true)
    public DeckProgressResponse getDeckProgress(UserPrincipal principal, UUID deckId) {
        UserDeckProgress progress = progressRepository.findById(new UserDeckProgressId(principal.getId(), deckId))
                .orElse(null);

        int liveTotalCards = (int) cardRepository.countByDeckId(deckId);

        if (progress == null) {
            return new DeckProgressResponse(deckId, liveTotalCards, 0, 0);
        }

        int learned = Math.min(progress.getLearnedCards(), liveTotalCards);
        int mastered = Math.min(progress.getMasteredCards(), learned);

        return new DeckProgressResponse(
                deckId,
                liveTotalCards,
                learned,
                mastered
        );
    }

    @Transactional(readOnly = true)
    public int countTotalDueCards(UserPrincipal principal, UUID deckId, boolean starredOnly) {
        UUID userId = principal.getId();
        if (deckId != null) {
            deckRepository.findAccessibleById(deckId, userId).orElseThrow(() -> new ForbiddenException("Deck not found or access denied"));
        }
        Instant now = Instant.now();
        long totalDue = reviewRepository.countDueReviews(userId, deckId, now, starredOnly)
                + (starredOnly ? 0 : countNewCards(userId, deckId));
        return (int) Math.min(totalDue, Integer.MAX_VALUE);
    }

    @Transactional(readOnly = true)
    public DueCardsResponse getDueCards(UserPrincipal principal, UUID deckId, int limit, boolean starredOnly) {
        UUID userId = principal.getId();
        if (deckId != null) {
            deckRepository.findAccessibleById(deckId, userId).orElseThrow(() -> new ForbiddenException("Deck not found or access denied"));
        }

        int max = limit > 0 ? Math.min(limit, 100) : DEFAULT_DUE_LIMIT;
        Instant now = Instant.now();

        List<UserCardReview> dueReviews =
                reviewRepository.findDueReviews(userId, deckId, now, starredOnly, PageRequest.of(0, max));

        List<DueCardResponse> cards = new ArrayList<>();
        Set<UUID> seen = new HashSet<>();

        Map<UUID, Card> cardCache = loadCards(dueReviews);
        for (UserCardReview review : dueReviews) {
            Card card = cardCache.get(review.getId().getCardId());
            if (card == null) {
                continue;
            }
            cards.add(DueCardResponse.fromReview(card, review));
            seen.add(card.getId());
        }

        int remaining = max - cards.size();
        if (remaining > 0 && !starredOnly) {
            List<Card> newCards = deckId != null
                    ? cardRepository.findNewCardsForUser(deckId, userId, PageRequest.of(0, remaining))
                    : cardRepository.findNewCardsForUserAcrossDecks(userId, PageRequest.of(0, remaining));
            for (Card card : newCards) {
                if (seen.add(card.getId())) {
                    cards.add(DueCardResponse.fromNewCard(card));
                }
            }
        }

        long totalDue = reviewRepository.countDueReviews(userId, deckId, now, starredOnly)
                + (starredOnly ? 0 : countNewCards(userId, deckId));

        return new DueCardsResponse(deckId, (int) Math.min(totalDue, Integer.MAX_VALUE), cards);
    }

    @Transactional
    public RateReviewResponse rateCard(UUID cardId, RateReviewRequest request, UserPrincipal principal) {
        UUID userId = principal.getId();
        Card card = cardRepository.findById(cardId).orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        Deck deck = deckRepository
                .findAccessibleById(card.getDeckId(), userId)
                .orElseThrow(() -> new ForbiddenException("You can only review cards in your own decks"));

        Instant now = Instant.now();
        UserCardReviewId reviewId = new UserCardReviewId(userId, cardId);
        UserCardReview review = reviewRepository
                .findById(reviewId)
                .orElseGet(() -> new UserCardReview(reviewId, deck.getId(), now));

        int oldReps = review.getRepetitions();
        int oldInterval = review.getIntervalDays();
        boolean wasLearned = oldReps > 0;
        boolean wasMastered = oldInterval >= sm2Properties.masteredIntervalDays();

        Sm2Algorithm.Result sm2 = Sm2Algorithm.apply(
                review.getEaseFactor(),
                review.getRepetitions(),
                review.getIntervalDays(),
                request.rating(),
                now,
                sm2Properties);

        review.setDeckId(deck.getId());
        review.setEaseFactor(sm2.easeFactor());
        review.setRepetitions(sm2.repetitions());
        review.setIntervalDays(sm2.intervalDays());
        review.setNextReviewAt(sm2.nextReviewAt());
        review.setLastRating(request.rating());
        review.setUpdatedAt(now);
        reviewRepository.save(review);

        int xpEarned = applyXpMultiplier(xpForRating(request.rating()), deck.getXpMultiplier());
        if (xpEarned > 0) {
            User user = userRepository
                    .findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setXp(user.getXp() + xpEarned);
            userRepository.save(user);
            upsertDailyActivity(userId, xpEarned, 1);
        }

        UserDeckProgress progress = ensureDeckProgress(userId, deck);
        progress.setLastStudiedAt(now);
        progress.setUpdatedAt(now);

        boolean isLearned = sm2.repetitions() > 0;
        boolean isMastered = sm2.intervalDays() >= sm2Properties.masteredIntervalDays();

        if (isLearned && !wasLearned) {
            progress.setLearnedCards(progress.getLearnedCards() + 1);
        }
        if (isMastered && !wasMastered) {
            progress.setMasteredCards(progress.getMasteredCards() + 1);
        }
        if (!isMastered && wasMastered) {
            progress.setMasteredCards(Math.max(0, progress.getMasteredCards() - 1));
        }

        progressRepository.save(progress);

        return new RateReviewResponse(
                cardId,
                sm2.repetitions(),
                sm2.easeFactor(),
                sm2.intervalDays(),
                sm2.nextReviewAt(),
                xpEarned);
    }

    @Transactional
    public StarReviewResponse toggleStar(UUID cardId, StarReviewRequest request, UserPrincipal principal) {
        UUID userId = principal.getId();
        Card card = cardRepository.findById(cardId).orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        deckRepository
                .findAccessibleById(card.getDeckId(), userId)
                .orElseThrow(() -> new ForbiddenException("You can only star cards in your own decks"));

        Instant now = Instant.now();
        UserCardReviewId reviewId = new UserCardReviewId(userId, cardId);
        UserCardReview review = reviewRepository
                .findById(reviewId)
                .orElseGet(() -> new UserCardReview(reviewId, card.getDeckId(), now));

        boolean starred = request.starred() != null ? request.starred() : !review.isStarred();
        review.setStarred(starred);
        review.setUpdatedAt(now);
        reviewRepository.save(review);

        return new StarReviewResponse(cardId, starred);
    }

    @Transactional
    public BatchRateResponse batchRateCards(BatchRateRequest request, UserPrincipal principal) {
        UUID userId = principal.getId();
        log.info("[OFFLINE SYNC] Received batch-rate request from userId {} for {} cards.", userId, request.reviews().size());
        
        int totalXpEarned = 0;
        int totalProcessed = 0;
        List<RateReviewResponse> details = new ArrayList<>();
        Map<LocalDate, int[]> dailyStats = new HashMap<>(); // [xp, count]

        User user = null;

        for (BatchRateRequest.ReviewItem item : request.reviews()) {
            UUID cardId = item.cardId();
            Card card = cardRepository.findById(cardId).orElse(null);
            if (card == null) continue;

            Deck deck = deckRepository.findAccessibleById(card.getDeckId(), userId).orElse(null);
            if (deck == null) continue;

            Instant ratedAt = item.ratedAt();
            UserCardReviewId reviewId = new UserCardReviewId(userId, cardId);
            UserCardReview review = reviewRepository.findById(reviewId).orElse(null);

            // Chống sync lặp hoặc conflict: Nếu updatedAt trên DB của server mới hơn ratedAt từ client -> Bỏ qua.
            if (review != null && review.getUpdatedAt().isAfter(ratedAt)) {
                log.info(" - Skipped card {} because DB updatedAt {} is after ratedAt {}", cardId, review.getUpdatedAt(), ratedAt);
                continue;
            }

            if (review == null) {
                review = new UserCardReview(reviewId, deck.getId(), ratedAt);
            }

            int oldReps = review.getRepetitions();
            int oldInterval = review.getIntervalDays();
            boolean wasLearned = oldReps > 0;
            boolean wasMastered = oldInterval >= sm2Properties.masteredIntervalDays();

            Sm2Algorithm.Result sm2 = Sm2Algorithm.apply(
                    review.getEaseFactor(), review.getRepetitions(), review.getIntervalDays(),
                    item.rating(), ratedAt, sm2Properties);

            review.setDeckId(deck.getId());
            review.setEaseFactor(sm2.easeFactor());
            review.setRepetitions(sm2.repetitions());
            review.setIntervalDays(sm2.intervalDays());
            review.setNextReviewAt(sm2.nextReviewAt());
            review.setLastRating(item.rating());
            review.setUpdatedAt(Instant.now()); // Thời điểm sync thực tế
            reviewRepository.save(review);
            
            log.info(" -> Synced cardId {} | rating: {} | historical time: {}", cardId, item.rating(), ratedAt);

            int xpEarned = applyXpMultiplier(xpForRating(item.rating()), deck.getXpMultiplier());
            totalXpEarned += xpEarned;
            totalProcessed++;

            LocalDate date = ratedAt.atZone(AppProperties.APP_ZONE).toLocalDate();
            int[] stats = dailyStats.computeIfAbsent(date, k -> new int[2]);
            stats[0] += xpEarned;
            stats[1] += 1;

            UserDeckProgress progress = ensureDeckProgress(userId, deck);
            if (progress.getLastStudiedAt() == null || progress.getLastStudiedAt().isBefore(ratedAt)) {
                progress.setLastStudiedAt(ratedAt);
                progress.setUpdatedAt(Instant.now());
            }

            boolean isLearned = sm2.repetitions() > 0;
            boolean isMastered = sm2.intervalDays() >= sm2Properties.masteredIntervalDays();
            if (isLearned && !wasLearned) progress.setLearnedCards(progress.getLearnedCards() + 1);
            if (isMastered && !wasMastered) progress.setMasteredCards(progress.getMasteredCards() + 1);
            if (!isMastered && wasMastered) progress.setMasteredCards(Math.max(0, progress.getMasteredCards() - 1));
            progressRepository.save(progress);

            details.add(new RateReviewResponse(cardId, sm2.repetitions(), sm2.easeFactor(), sm2.intervalDays(), sm2.nextReviewAt(), xpEarned));
        }

        if (totalXpEarned > 0) {
            user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setXp(user.getXp() + totalXpEarned);
            userRepository.save(user);
        }

        for (Map.Entry<LocalDate, int[]> entry : dailyStats.entrySet()) {
            upsertDailyActivityAtDate(userId, entry.getKey(), entry.getValue()[0], entry.getValue()[1]);
        }

        return new BatchRateResponse(totalProcessed, totalXpEarned, details);
    }


    // ============================================================
    // HELPERS
    // ============================================================

    private UserDeckProgress ensureDeckProgress(UUID userId, Deck deck) {
        UserDeckProgressId id = new UserDeckProgressId(userId, deck.getId());
        return progressRepository
                .findById(id)
                .orElseGet(() -> {
                    int total = (int) cardRepository.countByDeckId(deck.getId());
                    return progressRepository.save(
                            new UserDeckProgress(id, total, deck.getSourceDeckId()));
                });
    }

    private void upsertDailyActivityAtDate(UUID userId, LocalDate date, int xpEarned, int addedCards) {
        DailyActivity activity = dailyActivityRepository
                .findById(new com.backend.lumotus.entity.DailyActivityId(userId, date))
                .orElseGet(() -> new DailyActivity(userId, date));

        int oldCardsCount = activity.getCardsReviewed();
        int newCardsCount = oldCardsCount + addedCards;
        activity.setCardsReviewed(newCardsCount);

        // Estimate 1 minute of study time for every 5 cards reviewed
        int gainedMinutes = (newCardsCount / 5) - (oldCardsCount / 5);
        if (gainedMinutes > 0) {
            activity.setStudyMinutes(activity.getStudyMinutes() + gainedMinutes);
        }

        activity.setXpEarned(activity.getXpEarned() + xpEarned);
        dailyActivityRepository.save(activity);

        // Update streak if threshold reached (>= 10 cards OR 1 quiz)
        streakService.recordStudyActivity(userId);

        // Update global leaderboard score
        leaderboardService.updateUserScore(userId);
    }

    private void upsertDailyActivity(UUID userId, int xpEarned, int addedCards) {
        upsertDailyActivityAtDate(userId, LocalDate.now(AppProperties.APP_ZONE), xpEarned, addedCards);
    }

    private Map<UUID, Card> loadCards(List<UserCardReview> reviews) {
        Map<UUID, Card> map = new HashMap<>();
        for (UserCardReview review : reviews) {
            UUID cardId = review.getId().getCardId();
            cardRepository.findById(cardId).ifPresent(card -> map.put(cardId, card));
        }
        return map;
    }

    private long countNewCards(UUID userId, UUID deckId) {
        if (deckId != null) {
            return cardRepository.countNewCardsForUser(deckId, userId);
        }
        return cardRepository.countNewCardsForUserAcrossDecks(userId);
    }

    @Transactional(readOnly = true)
    public int countTotalDueCardsForDeckRef(UserPrincipal principal, String deckRef, boolean starredOnly) {
        UUID deckId = resolveDeckIdByRef(principal, deckRef);
        return countTotalDueCards(principal, deckId, starredOnly);
    }

    @Transactional(readOnly = true)
    public DueCardsResponse getDueCardsForDeckRef(
            UserPrincipal principal, String deckRef, int limit, boolean starredOnly) {
        UUID deckId = resolveDeckIdByRef(principal, deckRef);
        return getDueCards(principal, deckId, limit, starredOnly);
    }

    @Transactional(readOnly = true)
    public UUID resolveDeckIdByRef(UserPrincipal principal, String deckRef) {
        if (SlugUtils.isUuid(deckRef)) {
            Deck d = deckRepository.findAccessibleById(SlugUtils.parseUuid(deckRef), principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
            return d.getId();
        }
        List<Deck> decks = deckRepository.findAccessibleBySlug(principal.getId(), deckRef);
        if (decks.isEmpty()) {
            throw new ResourceNotFoundException("Deck not found");
        }
        return decks.get(0).getId();
    }

    private Deck resolveAccessibleDeck(String deckRef, UUID userId) {
        if (SlugUtils.isUuid(deckRef)) {
            return deckRepository
                    .findAccessibleById(SlugUtils.parseUuid(deckRef), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
        }
        List<Deck> decks = deckRepository.findAccessibleBySlug(userId, deckRef);
        if (decks.isEmpty()) throw new ResourceNotFoundException("Deck not found");
        return decks.get(0);
    }

    private static int xpForRating(ReviewRating rating) {
        return switch (rating) {
            case AGAIN -> 0;
            case HARD -> 5;
            case GOOD -> 10;
            case EASY -> 12;
        };
    }

    private static int applyXpMultiplier(int baseXp, double multiplier) {
        if (baseXp <= 0 || multiplier <= 0) {
            return 0;
        }
        double scaled = baseXp * multiplier;
        int rounded = (int) Math.ceil(scaled);
        return Math.max(rounded, 1);
    }
}
