package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.RateReviewRequest;
import com.backend.lumotus.dto.request.StarReviewRequest;
import com.backend.lumotus.dto.response.DueCardResponse;
import com.backend.lumotus.dto.response.DueCardsResponse;
import com.backend.lumotus.dto.response.RateReviewResponse;
import com.backend.lumotus.dto.response.StarReviewResponse;
import com.backend.lumotus.entity.Card;
import com.backend.lumotus.entity.DailyActivity;
import com.backend.lumotus.entity.Deck;
import com.backend.lumotus.entity.User;
import com.backend.lumotus.entity.UserCardReview;
import com.backend.lumotus.entity.UserCardReviewId;
import com.backend.lumotus.entity.UserDeckProgress;
import com.backend.lumotus.entity.UserDeckProgressId;
import com.backend.lumotus.exception.ForbiddenException;
import com.backend.lumotus.exception.ResourceNotFoundException;
import com.backend.lumotus.repository.CardRepository;
import com.backend.lumotus.repository.DailyActivityRepository;
import com.backend.lumotus.repository.DeckRepository;
import com.backend.lumotus.repository.UserCardReviewRepository;
import com.backend.lumotus.repository.UserDeckProgressRepository;
import com.backend.lumotus.repository.UserRepository;
import com.backend.lumotus.entity.ReviewRating;
import com.backend.lumotus.review.Sm2Algorithm;
import com.backend.lumotus.security.UserPrincipal;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final int DEFAULT_DUE_LIMIT = 50;
    private static final int MASTERED_INTERVAL_DAYS = 21;

    private final UserCardReviewRepository reviewRepository;
    private final UserDeckProgressRepository progressRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final CardRepository cardRepository;
    private final DeckRepository deckRepository;
    private final UserRepository userRepository;

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
                .findByIdAndOwnerId(card.getDeckId(), userId)
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
                .findByIdAndOwnerId(card.getDeckId(), userId)
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

    private static int xpForRating(ReviewRating rating) {
        return switch (rating) {
            case AGAIN -> 0;
            case HARD -> 5;
            case GOOD -> 10;
            case EASY -> 12;
        };
    }
}
