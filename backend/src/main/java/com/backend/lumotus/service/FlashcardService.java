package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.RateReviewRequest;
import com.backend.lumotus.dto.request.StarReviewRequest;
import com.backend.lumotus.dto.request.StartStudyRequest;
import com.backend.lumotus.dto.request.SubmitStudyRequest;
import com.backend.lumotus.dto.response.DeckProgressResponse;
import com.backend.lumotus.dto.response.DueCardResponse;
import com.backend.lumotus.dto.response.DueCardsResponse;
import com.backend.lumotus.dto.response.QuestionResponse;
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
import com.backend.lumotus.review.Sm2Algorithm;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.study.QuestionGenerator;
import com.backend.lumotus.study.StudyAttempt;
import com.backend.lumotus.util.SlugUtils;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
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
    private static final int MASTERED_INTERVAL_DAYS = 21;

    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final UserCardReviewRepository reviewRepository;
    private final UserDeckProgressRepository progressRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final UserRepository userRepository;
    private final StreakService streakService;

    private final Map<UUID, StudyAttempt> activeAttempts = new ConcurrentHashMap<>();

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

        int count = request.count() != null ? request.count() : Math.min(10, allCards.size());
        String direction = request.direction() != null ? request.direction() : "forward";

        StudyAttempt attempt = new StudyAttempt(userId, deck.getId(), StudyMode.FLASHCARD);
        List<QuestionResponse> questions = new QuestionGenerator(allCards, StudyMode.FLASHCARD, count, direction).generate();

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

        if (progress == null) {
            int totalCards = (int) cardRepository.countByDeckId(deckId);
            return new DeckProgressResponse(deckId, totalCards, 0, 0);
        }

        return new DeckProgressResponse(
                deckId,
                progress.getTotalCards(),
                progress.getLearnedCards(),
                progress.getMasteredCards()
        );
    }

    @Transactional(readOnly = true)
    public DueCardsResponse getDueCards(UserPrincipal principal, UUID deckId, int limit, boolean starredOnly) {
        UUID userId = principal.getId();
        if (deckId != null) {
            assertOwnedDeck(deckId, userId);
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
        boolean wasMastered = oldInterval >= MASTERED_INTERVAL_DAYS;

        Sm2Algorithm.Result sm2 = Sm2Algorithm.apply(
                review.getEaseFactor(),
                review.getRepetitions(),
                review.getIntervalDays(),
                request.rating(),
                now);

        review.setDeckId(deck.getId());
        review.setEaseFactor(sm2.easeFactor());
        review.setRepetitions(sm2.repetitions());
        review.setIntervalDays(sm2.intervalDays());
        review.setNextReviewAt(sm2.nextReviewAt());
        review.setLastRating(request.rating());
        review.setUpdatedAt(now);
        reviewRepository.save(review);

        int xpEarned = xpForRating(request.rating());
        if (xpEarned > 0) {
            User user = userRepository
                    .findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setXp(user.getXp() + xpEarned);
            userRepository.save(user);
            upsertDailyActivity(userId, xpEarned);
        }

        UserDeckProgress progress = ensureDeckProgress(userId, deck);
        progress.setLastStudiedAt(now);
        progress.setUpdatedAt(now);

        boolean isLearned = sm2.repetitions() > 0;
        boolean isMastered = sm2.intervalDays() >= MASTERED_INTERVAL_DAYS;

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

    private void upsertDailyActivity(UUID userId, int xpEarned) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        DailyActivity activity = dailyActivityRepository
                .findById(new com.backend.lumotus.entity.DailyActivityId(userId, today))
                .orElseGet(() -> new DailyActivity(userId, today));
        activity.setCardsReviewed(activity.getCardsReviewed() + 1);
        activity.setXpEarned(activity.getXpEarned() + xpEarned);
        dailyActivityRepository.save(activity);

        // Update streak if threshold reached
        streakService.recordStudyActivity(userId);
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

    private void assertOwnedDeck(UUID deckId, UUID userId) {
        deckRepository
                .findByIdAndOwnerId(deckId, userId)
                .orElseThrow(() -> new ForbiddenException("Deck not found or not owned"));
    }

    @Transactional(readOnly = true)
    public DueCardsResponse getDueCardsForDeckRef(
            UserPrincipal principal, String deckRef, int limit, boolean starredOnly) {
        Deck deck = resolveOwnedDeck(deckRef, principal.getId());
        return getDueCards(principal, deck.getId(), limit, starredOnly);
    }

    @Transactional(readOnly = true)
    public UUID resolveDeckIdByRef(UserPrincipal principal, String deckRef) {
        List<Deck> decks = deckRepository.findAccessibleBySlug(principal.getId(), deckRef);
        if (decks.isEmpty()) {
            throw new ResourceNotFoundException("Deck not found");
        }
        return decks.get(0).getId();
    }

    private Deck resolveOwnedDeck(String deckRef, UUID userId) {
        if (SlugUtils.isUuid(deckRef)) {
            return deckRepository
                    .findByIdAndOwnerId(SlugUtils.parseUuid(deckRef), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
        }
        return deckRepository
                .findByOwnerIdAndSlug(userId, deckRef)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
    }

    private Deck resolveAccessibleDeck(String deckRef, UUID userId) {
        if (SlugUtils.isUuid(deckRef)) {
            return deckRepository
                    .findById(SlugUtils.parseUuid(deckRef))
                    .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
        }
        return deckRepository
                .findByOwnerIdAndSlug(userId, deckRef)
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
    }

    private static int xpForRating(ReviewRating rating) {
        return switch (rating) {
            case AGAIN -> 0;
            case HARD -> 5;
            case GOOD -> 10;
            case EASY -> 12;
        };
    }
}
