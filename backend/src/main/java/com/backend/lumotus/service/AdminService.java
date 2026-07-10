package com.backend.lumotus.service;

import com.backend.lumotus.config.AppProperties;
import com.backend.lumotus.dto.response.AdminStatsResponse;
import com.backend.lumotus.dto.response.CardResponse;
import com.backend.lumotus.dto.response.DeckSummaryResponse;
import com.backend.lumotus.dto.response.PageResponse;
import com.backend.lumotus.dto.response.QuizAttemptAdminResponse;
import com.backend.lumotus.dto.response.UserAdminResponse;
import com.backend.lumotus.entity.*;
import com.backend.lumotus.exception.BadRequestException;
import com.backend.lumotus.exception.ForbiddenException;
import com.backend.lumotus.exception.ResourceNotFoundException;
import com.backend.lumotus.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.lumotus.dto.response.AdminChartDataPoint;
import com.backend.lumotus.dto.response.DailyActivityAdminResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Admin service for user management and system statistics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final QuizRepository quizRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final DeckModerationLogRepository deckModerationLogRepository;
    private final DeckTopicRepository deckTopicRepository;
    private final TopicRepository topicRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final UserCardReviewRepository userCardReviewRepository;
    private final UserDeckProgressRepository userDeckProgressRepository;
    private final DeckTagRepository deckTagRepository;

    /**
     * Get system-wide statistics.
     */
    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        LocalDate today = LocalDate.now(AppProperties.APP_ZONE);

        long totalUsers = userRepository.count();
        long totalDecks = deckRepository.count();
        long totalCards = cardRepository.count();
        long totalQuizzes = quizRepository.count();
        long totalQuizAttempts = quizAttemptRepository.count();

        long activeUsersToday = dailyActivityRepository.countActiveUsersOnDate(today, today);
        int reviewsToday = dailyActivityRepository.sumCardsReviewedAll(today, today);
        int xpToday = dailyActivityRepository.sumXpEarnedAll(today, today);

        return new AdminStatsResponse(
                totalUsers,
                totalDecks,
                totalCards,
                totalQuizzes,
                totalQuizAttempts,
                activeUsersToday,
                reviewsToday,
                xpToday
        );
    }

    /**
     * List all users with pagination.
     */
    @Transactional(readOnly = true)
    public Page<UserAdminResponse> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(UserAdminResponse::from);
    }

    /**
     * Get a specific user by ID.
     */
    @Transactional(readOnly = true)
    public UserAdminResponse getUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserAdminResponse.from(user);
    }

    /**
     * Update user's role or active status.
     */
    @Transactional
    public UserAdminResponse updateUser(UUID targetUserId, String role, Boolean active) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (role != null) {
            try {
                user.setRole(User.Role.valueOf(role.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role: " + role);
            }
        }

        if (active != null) {
            user.setActive(active);
        }

        userRepository.save(user);
        log.info("Admin updated user {}: role={}, active={}", targetUserId, role, active);

        return UserAdminResponse.from(user);
    }

    /**
     * Get all quiz attempts with pagination.
     */
    @Transactional(readOnly = true)
    public Page<QuizAttemptAdminResponse> getAllQuizAttempts(Pageable pageable) {
        return quizAttemptRepository.findAllWithUserAndQuizOrderByStartedAtDesc(pageable)
                .map(QuizAttemptAdminResponse::from);
    }

    /**
     * Get quiz attempts by user ID.
     */
    @Transactional(readOnly = true)
    public Page<QuizAttemptAdminResponse> getQuizAttemptsByUser(UUID userId, Pageable pageable) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return quizAttemptRepository.findByUserIdWithDetails(userId, pageable)
                .map(QuizAttemptAdminResponse::from);
    }

    /**
     * Get quiz attempts by quiz ID.
     */
    @Transactional(readOnly = true)
    public Page<QuizAttemptAdminResponse> getQuizAttemptsByQuiz(UUID quizId, Pageable pageable) {
        // Verify quiz exists
        quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        return quizAttemptRepository.findByQuizIdWithDetails(quizId, pageable)
                .map(QuizAttemptAdminResponse::from);
    }

    /**
     * Check if current user is admin.
     */
    public void requireAdmin(String userRole) {
        if (!"ADMIN".equals(userRole)) {
            throw new ForbiddenException("Admin access required");
        }
    }

    /**
     * GET /api/v1/admin/decks/{deckRef}
     * Admin-only endpoint — bypasses user access checks so moderators can view
     * any deck including PENDING decks of other users.
     */
    @Transactional(readOnly = true)
    public DeckSummaryResponse getAdminDeck(String deckRef, String moderatorRole) {
        requireAdmin(moderatorRole);
        Deck deck = resolveAdminDeck(deckRef);
        return buildDeckSummary(deck);
    }

    /**
     * GET /api/v1/admin/decks/{deckRef}/cards
     */
    @Transactional(readOnly = true)
    public PageResponse<CardResponse> listAdminDeckCards(
            String deckRef, String q, Pageable pageable) {
        Deck deck = resolveAdminDeck(deckRef);
        var pageSize = pageable.getPageSize() > 0 ? pageable.getPageSize() : 50;
        Page<com.backend.lumotus.entity.Card> cards = cardRepository.searchByDeckId(
                deck.getId(), blankToNull(q),
                org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageSize));
        return PageResponse.from(cards.map(CardResponse::from));
    }

    @Transactional
    public DeckSummaryResponse approveDeck(String deckRef, String moderatorRole, UUID moderatorId, String note, List<UUID> topicIds) {
        requireAdmin(moderatorRole);
        Deck deck = resolveAdminDeck(deckRef);
        if (!"PENDING".equals(deck.getVerificationStatus())) {
            throw new BadRequestException("Deck is not pending approval");
        }

        deck.setVerificationStatus("APPROVED");
        deck.setVerifiedAt(java.time.Instant.now());
        deck.setVerifiedById(moderatorId);
        deck.setVerificationNote(note);
        deck.setPublic(true);
        deckRepository.save(deck);

        if (topicIds != null && !topicIds.isEmpty()) {
            deckTopicRepository.deleteAllByDeckId(deck.getId());
            for (UUID topicId : topicIds) {
                Topic topic = topicRepository.findById(topicId)
                        .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + topicId));
                DeckTopic dt = new DeckTopic(new DeckTopicId(deck.getId(), topic.getId()));
                dt.setTopic(topic);
                deckTopicRepository.save(dt);
            }
        }

        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Moderator not found"));
        deckModerationLogRepository.save(new DeckModerationLog(
                deck, moderator, DeckModerationLog.Action.APPROVE, note));

        return buildDeckSummary(deck);
    }

    /**
     * POST /api/v1/admin/decks/{deckRef}/publish
     * Publishes an OFFICIAL deck (sets isPublic=true).
     */
    @Transactional
    public DeckSummaryResponse publishDeck(String deckRef, String moderatorRole, UUID moderatorId) {
        requireAdmin(moderatorRole);
        Deck deck = resolveAdminDeck(deckRef);
        if (!"OFFICIAL".equals(deck.getSourceType())) {
            throw new BadRequestException("Only OFFICIAL decks can be published manually");
        }
        if (deck.isPublic()) {
            throw new BadRequestException("Deck is already published");
        }

        deck.setPublic(true);
        deck.setVerificationStatus("APPROVED");
        deck.setVerifiedAt(java.time.Instant.now());
        deck.setVerifiedById(moderatorId);
        deckRepository.save(deck);

        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Moderator not found"));
        deckModerationLogRepository.save(new DeckModerationLog(
                deck, moderator, DeckModerationLog.Action.APPROVE, "Published manually"));

        return buildDeckSummary(deck);
    }

    @Transactional
    public DeckSummaryResponse rejectDeck(String deckRef, String moderatorRole, UUID moderatorId, String note) {
        requireAdmin(moderatorRole);
        Deck deck = resolveAdminDeck(deckRef);
        if (!"PENDING".equals(deck.getVerificationStatus())) {
            throw new BadRequestException("Deck is not pending approval");
        }

        deck.setVerificationStatus("REJECTED");
        deck.setVerifiedAt(java.time.Instant.now());
        deck.setVerifiedById(moderatorId);
        deck.setVerificationNote(note);
        deck.setPublic(false);
        deck.setSourceType("PERSONAL");
        deck.setXpMultiplier(0.1);
        deckRepository.save(deck);

        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Moderator not found"));
        deckModerationLogRepository.save(new DeckModerationLog(
                deck, moderator, DeckModerationLog.Action.REJECT, note));

        return buildDeckSummary(deck);
    }

    @Transactional
    public void hardDeleteDeck(String deckRef, String moderatorRole) {
        requireAdmin(moderatorRole);
        log.info("Starting hard delete for: {}", deckRef);
        Deck deck = resolveAdminDeck(deckRef);
        log.info("Found deck id={}", deck.getId());
        UUID deckId = deck.getId();

        if (deck.isPublic()) {
            log.warn("Hard deleting PUBLIC deck: {} (id={}) — deck is currently published!", deck.getTitle(), deckId);
        }

        // Delete deck row — CASCADE FK handles all child tables (cards, user_card_review,
        // user_deck_progress, deck_topics, deck_tags, deck_moderation_logs, quizzes)
        log.info("Deleting deck {} from database", deckId);
        deckRepository.deleteDeckHard(deckId);
        log.info("Hard delete completed for deck {}", deckId);
    }

    private Deck resolveAdminDeck(String deckRef) {
        if (com.backend.lumotus.util.SlugUtils.isUuid(deckRef)) {
            log.info("Looking up deck by UUID: {}", deckRef);
            Optional<Deck> optDeck = deckRepository.findByIdIncludingDeleted(UUID.fromString(deckRef));
            log.info("Result: {}", optDeck);
            return optDeck
                    .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
        } else {
            log.info("Looking up deck by slug: {}", deckRef);
            List<Deck> matches = deckRepository.findBySlugIncludingDeleted(deckRef);
            log.info("Found {} matches for slug: {}", matches.size(), deckRef);
            if (matches.isEmpty()) {
                throw new ResourceNotFoundException("Deck not found");
            }
            if (matches.size() == 1) {
                return matches.get(0);
            }
            return matches.stream()
                    .filter(d -> "PENDING".equals(d.getVerificationStatus()))
                    .findFirst()
                    .orElseGet(() -> matches.stream()
                            .filter(d -> "OFFICIAL".equals(d.getSourceType()))
                            .findFirst()
                            .orElse(matches.get(0)));
        }
    }

    private DeckSummaryResponse buildDeckSummary(Deck deck) {
        long cardCount = cardRepository.countByDeckId(deck.getId());
        String ownerUsername = userRepository.findById(deck.getOwnerId())
                .map(u -> u.getUsername())
                .orElse("unknown");
        var deckTopics = deckTopicRepository.findByIdDeckId(deck.getId());
        List<com.backend.lumotus.dto.response.TopicResponse> topicResponses = deckTopics.stream()
                .map(dt -> com.backend.lumotus.dto.response.TopicResponse.from(dt.getTopic()))
                .toList();
        return DeckSummaryResponse.from(
                deck, cardCount, topicResponses, ownerUsername, null);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /**
     * Get paginated study history summary grouped by user (master list).
     * Maps the 8-column JPQL projection from findUserStudySummaries.
     * Columns: [0]=userId, [1]=username, [2]=sumCards, [3]=sumXp, [4]=sumQuiz,
     *          [5]=lastDate, [6]=sumStudyMin, [7]=streak
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<DailyActivityAdminResponse> getStudyHistory(Pageable pageable) {
        return dailyActivityRepository.findUserStudySummaries(pageable)
                .map(row -> {
                    UUID uid = (UUID) row[0];
                    int streak = row[7] != null ? ((Number) row[7]).intValue() : 0;
                    long deckCount = deckRepository.countByOwnerId(uid);
                    long totalCards = cardRepository.countTotalCardsByOwnerId(uid);
                    long learnedCards = userDeckProgressRepository.sumLearnedCardsByUserId(uid);
                    return new DailyActivityAdminResponse(
                            uid,
                            (String) row[1],
                            row[5] instanceof java.time.LocalDate ld ? ld
                                    : java.time.LocalDate.parse(row[5].toString()),
                            (int) totalCards,
                            (int) learnedCards,
                            row[2] != null ? ((Number) row[2]).intValue() : 0,
                            row[3] != null ? ((Number) row[3]).intValue() : 0,
                            row[4] != null ? ((Number) row[4]).intValue() : 0,
                            row[6] != null ? ((Number) row[6]).intValue() : 0,
                            streak,
                            (int) deckCount
                    );
                });
    }

    /**
     * Get paginated daily study activity for a specific user (for admin detail drill-down).
     */
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<DailyActivityAdminResponse> getStudyHistoryByUser(UUID userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return dailyActivityRepository.findByUserIdOrderByDateDesc(userId, pageable)
                .map(da -> DailyActivityAdminResponse.from(da, user.getUsername()));
    }

    /**
     * Get daily aggregated chart statistics for admin dashboard.
     * Fills in missing dates with zeros so charts display a continuous line.
     */
    @Transactional(readOnly = true)
    public List<AdminChartDataPoint> getChartStats(LocalDate startDate, LocalDate endDate) {
        Instant start = startDate.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant end = endDate.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        // Query raw aggregated rows
        Map<LocalDate, Long> userMap = userRepository.countNewUsersByDay(start, end)
                .stream().collect(Collectors.toMap(
                        row -> ((java.sql.Date) row[0]).toLocalDate(),
                        row -> ((Number) row[1]).longValue()));

        Map<LocalDate, Long> deckMap = deckRepository.countNewDecksByDay(start, end)
                .stream().collect(Collectors.toMap(
                        row -> ((java.sql.Date) row[0]).toLocalDate(),
                        row -> ((Number) row[1]).longValue()));

        Map<LocalDate, Long> quizMap = quizAttemptRepository.countQuizAttemptsByDay(start, end)
                .stream().collect(Collectors.toMap(
                        row -> ((java.sql.Date) row[0]).toLocalDate(),
                        row -> ((Number) row[1]).longValue()));

        // Fill every date in range
        List<AdminChartDataPoint> result = new ArrayList<>();
        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            result.add(new AdminChartDataPoint(
                    d,
                    userMap.getOrDefault(d, 0L),
                    deckMap.getOrDefault(d, 0L),
                    quizMap.getOrDefault(d, 0L)));
        }
        return result;
    }
}
