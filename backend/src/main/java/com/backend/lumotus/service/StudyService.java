package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.StartStudyRequest;
import com.backend.lumotus.dto.request.SubmitStudyRequest;
import com.backend.lumotus.dto.response.*;
import com.backend.lumotus.entity.*;
import com.backend.lumotus.exception.BadRequestException;
import com.backend.lumotus.exception.ResourceNotFoundException;
import com.backend.lumotus.repository.*;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.study.QuestionGenerator;
import com.backend.lumotus.study.StudyAttempt;
import com.backend.lumotus.util.SlugUtils;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudyService {

    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final DailyActivityRepository dailyActivityRepository;

    private final Map<UUID, StudyAttempt> activeAttempts = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public StartStudyResponse startStudy(UserPrincipal principal, String deckRef, StartStudyRequest request) {
        UUID userId = principal.getId();
        Deck deck = resolveOwnedDeck(deckRef, userId);

        List<Card> allCards = cardRepository.findByDeckIdOrderBySortOrderAsc(deck.getId());
        if (allCards.isEmpty()) {
            throw new BadRequestException("Deck has no cards");
        }

        int count = request.count() != null ? request.count() : Math.min(10, allCards.size());
        String direction = request.direction() != null ? request.direction() : "forward";

        StudyAttempt attempt = new StudyAttempt(userId, deck.getId(), request.mode());
        List<QuestionResponse> questions = new QuestionGenerator(allCards, request.mode(), count, direction).generate();

        for (QuestionResponse q : questions) {
            attempt.addQuestion(q.questionId(), q.correctAnswer(), q.cardInfo());
        }

        activeAttempts.put(attempt.getAttemptId(), attempt);

        return new StartStudyResponse(
                attempt.getAttemptId(),
                request.mode(),
                deck.getTitle(),
                allCards.size(),
                questions
        );
    }

    @Transactional
    public StudyResultResponse submitStudy(UUID attemptId, SubmitStudyRequest request, UserPrincipal principal) {
        StudyAttempt attempt = activeAttempts.remove(attemptId);
        if (attempt == null) {
            throw new ResourceNotFoundException("Study session not found or already submitted");
        }
        if (!attempt.getUserId().equals(principal.getId())) {
            throw new ResourceNotFoundException("Study session not found");
        }

        for (SubmitStudyRequest.Answer ans : request.answers()) {
            attempt.recordAnswer(ans.questionId(), ans.selectedAnswer());
        }

        attempt.finish();
        return buildResult(attempt, principal);
    }

    public StudyResultResponse getResult(UUID attemptId, UserPrincipal principal) {
        StudyAttempt attempt = activeAttempts.get(attemptId);
        if (attempt == null) {
            throw new ResourceNotFoundException("Study session not found");
        }
        if (!attempt.getUserId().equals(principal.getId())) {
            throw new ResourceNotFoundException("Study session not found");
        }
        return buildResult(attempt, principal);
    }

    private StudyResultResponse buildResult(StudyAttempt attempt, UserPrincipal principal) {
        int correct = attempt.getCorrectCount();
        int total = attempt.getTotalCount();
        double score = total > 0 ? (double) correct / total : 0;

        int xpEarned = calculateXp(attempt.getMode(), correct);
        if (xpEarned > 0) {
            User user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setXp(user.getXp() + xpEarned);
            userRepository.save(user);

            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            DailyActivity activity = dailyActivityRepository
                    .findById(new DailyActivityId(principal.getId(), today))
                    .orElseGet(() -> new DailyActivity(principal.getId(), today));
            activity.setCardsReviewed(activity.getCardsReviewed() + total);
            if (attempt.getMode() != StudyMode.FLASHCARD) {
                activity.setQuizTaken(activity.getQuizTaken() + 1);
            }
            activity.setXpEarned(activity.getXpEarned() + xpEarned);
            dailyActivityRepository.save(activity);
        }

        List<AnswerDetail> details = buildDetails(attempt);

        return new StudyResultResponse(
                attempt.getAttemptId().toString(),
                attempt.getMode(),
                score,
                correct,
                total,
                xpEarned,
                attempt.timeTakenSeconds(),
                details
        );
    }

    private int calculateXp(StudyMode mode, int correct) {
        if (correct == 0) return 0;
        return switch (mode) {
            case QUIZ -> correct * 8;
            case LEARN -> correct * 10;
            case SPELL -> correct * 12;
            case FLASHCARD -> 0;
        };
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
}
