package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.CreateQuizRequest;
import com.backend.lumotus.dto.request.HeartbeatRequest;
import com.backend.lumotus.dto.request.ImportQuizRequest;
import com.backend.lumotus.dto.request.ModerateQuizRequest;
import com.backend.lumotus.dto.request.SubmitForReviewRequest;
import com.backend.lumotus.dto.request.SubmitQuizRequest;
import com.backend.lumotus.dto.request.UpdateQuestionRequest;
import com.backend.lumotus.dto.request.UpdateQuizRequest;
import com.backend.lumotus.dto.response.*;
import com.backend.lumotus.entity.*;
import com.backend.lumotus.exception.BadRequestException;
import com.backend.lumotus.exception.ForbiddenException;
import com.backend.lumotus.exception.ResourceNotFoundException;
import com.backend.lumotus.repository.*;
import com.backend.lumotus.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final QuizSessionService quizSessionService;
    private final StreakService streakService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ============================================================
    // CREATE — USER creates quiz for self-study (always PENDING until submitted)
    // ============================================================

    @Transactional
    public QuizDetailResponse createQuiz(UserPrincipal principal, CreateQuizRequest request) {
        Deck deck = deckRepository.findById(request.deckId())
                .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));

        boolean isOwner = deck.getOwnerId().equals(principal.getId());
        if (!isOwner) {
            throw new ForbiddenException("You can only create quizzes for your own decks");
        }

        List<Card> cards = cardRepository.findByDeckIdOrderBySortOrderAsc(deck.getId());
        if (cards.isEmpty()) {
            throw new BadRequestException("Deck has no cards");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        int count = Math.min(request.questionCount() != null ? request.questionCount() : 10, cards.size());

        Quiz quiz = Quiz.builder()
                .title(request.title())
                .description(request.description())
                .coverImageUrl(request.coverImageUrl())
                .deck(deck)
                .ownerId(principal.getId())
                .ownerUsername(user.getUsername())
                .quizType(Quiz.QuizType.GENERATED)
                .isImmutable(false)
                .isPublic(false)
                .status(Quiz.QuizStatus.DRAFT)
                .timeLimitSeconds(request.timeLimitSeconds())
                .questionCount(count)
                .build();

        quiz = quizRepository.save(quiz);

        List<QuizQuestion> questions = generateQuestions(quiz, cards, count);
        quiz.setQuestions(questions);

        return buildDetailResponse(quiz);
    }

    @Transactional
    public QuizDetailResponse updateQuiz(UserPrincipal principal, UUID quizId, UpdateQuizRequest request) {
        Quiz quiz = findOwnedQuiz(principal, quizId);
        assertMutable(quiz);

        if (request.title() != null) quiz.setTitle(request.title());
        if (request.description() != null) quiz.setDescription(request.description());
        if (request.coverImageUrl() != null) quiz.setCoverImageUrl(request.coverImageUrl());
        if (request.timeLimitSeconds() != null) quiz.setTimeLimitSeconds(request.timeLimitSeconds());
        if (request.questionCount() != null) quiz.setQuestionCount(request.questionCount());

        quiz = quizRepository.save(quiz);
        return buildDetailResponse(quiz);
    }

    @Transactional
    public void deleteQuiz(UserPrincipal principal, UUID quizId) {
        Quiz quiz = findOwnedQuiz(principal, quizId);
        assertMutable(quiz);
        quizRepository.delete(quiz);
    }

    @Transactional
    public void updateQuestion(UserPrincipal principal, UUID quizId, UUID questionId, UpdateQuestionRequest request) {
        Quiz quiz = findOwnedQuiz(principal, quizId);
        assertMutable(quiz);

        QuizQuestion question = quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        if (!question.getQuiz().getId().equals(quizId)) {
            throw new BadRequestException("Question does not belong to this quiz");
        }

        question.setQuestionText(request.questionText());
        question.setCorrectAnswer(request.correctAnswer());
        question.setQuestionType(QuizQuestion.QuestionType.valueOf(request.questionType()));

        if (request.options() != null && !request.options().isEmpty()) {
            try {
                question.setOptions(objectMapper.writeValueAsString(request.options()));
            } catch (Exception ignored) {}
        }

        quizQuestionRepository.save(question);
    }

    // ============================================================
    // PUBLIC EXPLORE — APPROVED quizzes only
    // ============================================================

    @Transactional(readOnly = true)
    public PageResponse<QuizSummaryResponse> listExploreQuizzes(Pageable pageable) {
        Page<Quiz> page = quizRepository.findByStatusOrderByCreatedAtDesc(Quiz.QuizStatus.APPROVED, pageable);
        return PageResponse.from(page, QuizSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public QuizDetailResponse getExploreQuiz(UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        if (quiz.getStatus() != Quiz.QuizStatus.APPROVED) {
            throw new ResourceNotFoundException("Quiz not found");
        }

        return buildDetailResponse(quiz);
    }

    // ============================================================
    // MY QUIZZES — user's own (all statuses)
    // ============================================================

    @Transactional(readOnly = true)
    public PageResponse<QuizSummaryResponse> listMyQuizzes(UserPrincipal principal, Pageable pageable) {
        Page<Quiz> page = quizRepository.findByOwnerIdOrderByCreatedAtDesc(principal.getId(), pageable);
        return PageResponse.from(page, QuizSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public QuizDetailResponse getMyQuiz(UserPrincipal principal, UUID quizId) {
        Quiz quiz = findOwnedQuiz(principal, quizId);
        return buildDetailResponse(quiz);
    }

    // ============================================================
    // SUBMIT FOR REVIEW — user sends for approval
    // ============================================================

    @Transactional
    public QuizSummaryResponse submitForReview(UserPrincipal principal, SubmitForReviewRequest request) {
        Quiz quiz = findOwnedQuiz(principal, request.quizId());

        if (quiz.getStatus() == Quiz.QuizStatus.APPROVED) {
            throw new BadRequestException("Quiz is already approved");
        }
        if (quiz.getStatus() == Quiz.QuizStatus.PENDING) {
            throw new BadRequestException("Quiz is already submitted for review");
        }
        if (quiz.getQuizType() == Quiz.QuizType.IMPORTED) {
            throw new BadRequestException("Imported quizzes cannot be submitted for review");
        }

        quiz.setStatus(Quiz.QuizStatus.PENDING);
        quiz.setRejectionNote(null);
        quiz = quizRepository.save(quiz);

        return QuizSummaryResponse.from(quiz);
    }

    // ============================================================
    // START — two paths:
    //   1. Self-study: quizId of owned quiz (no XP, no leaderboard)
    //   2. Public: quizId of APPROVED quiz (XP awarded, leaderboard eligible)
    // ============================================================

    @Transactional
    public StartQuizResponse startQuiz(UserPrincipal principal, UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        boolean isOwner = quiz.getOwnerId().equals(principal.getId());
        boolean isApproved = quiz.getStatus() == Quiz.QuizStatus.APPROVED;

        if (!isApproved && !isOwner) {
            throw new ResourceNotFoundException("Quiz not found");
        }

        List<QuizQuestion> questions = quizQuestionRepository.findByQuizIdOrderBySortOrderAsc(quizId);

        if (questions.isEmpty()) {
            throw new BadRequestException("Quiz has no questions");
        }

        // Shuffle questions for variety
        List<QuizQuestion> shuffled = new ArrayList<>(questions);
        Collections.shuffle(shuffled);

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        QuizAttempt attempt = QuizAttempt.builder()
                .user(user)
                .quiz(quiz)
                .startedAt(java.time.Instant.now())
                .totalQuestions(shuffled.size())
                .build();
        attempt = quizAttemptRepository.save(attempt);

        // Persist session to Redis for timer persistence (competitive quizzes)
        quizSessionService.startSession(
                attempt.getId().toString(),
                principal.getId().toString(),
                attempt.getStartedAt(),
                quiz.getTimeLimitSeconds()
        );

        List<QuizQuestionResponse> questionResponses = shuffled.stream()
                .map(q -> new QuizQuestionResponse(
                        q.getId(),
                        q.getQuestionType().name(),
                        q.getQuestionText(),
                        q.getCorrectAnswer(),
                        parseOptions(q.getOptions()),
                        q.getSortOrder()
                ))
                .toList();

        return new StartQuizResponse(
                attempt.getId(),
                quiz.getTitle(),
                questionResponses.size(),
                quiz.getTimeLimitSeconds(),
                attempt.getStartedAt().getEpochSecond(),
                questionResponses
        );
    }

    // ============================================================
    // SUBMIT
    // ============================================================

    @Transactional
    public QuizResultResponse submitQuiz(UserPrincipal principal, SubmitQuizRequest request) {
        if (request.attemptId() == null) {
            throw new BadRequestException("attemptId is required");
        }

        QuizAttempt attempt = quizAttemptRepository.findById(UUID.fromString(request.attemptId()))
                .orElseThrow(() -> new ResourceNotFoundException("Quiz attempt not found"));

        if (!attempt.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("This is not your quiz attempt");
        }

        // Prevent duplicate submit
        if (attempt.getFinishedAt() != null) {
            throw new BadRequestException("Quiz has already been submitted");
        }

        Quiz quiz = attempt.getQuiz();
        boolean isOwner = quiz != null && quiz.getOwnerId().equals(principal.getId());
        boolean isApproved = quiz != null && quiz.getStatus() == Quiz.QuizStatus.APPROVED;
        boolean qualifiesForLeaderboard = isApproved && !isOwner;

        // Server-side time enforcement for competitive quizzes
        if (qualifiesForLeaderboard && !quizSessionService.validateTimeLimit(
                request.attemptId(), principal.getId().toString(), request.timeTakenSeconds())) {
            throw new BadRequestException("Quiz session has expired");
        }

        List<QuizQuestion> dbQuestions = quiz != null
                ? quizQuestionRepository.findByQuizIdOrderBySortOrderAsc(quiz.getId())
                : Collections.emptyList();

        Map<UUID, QuizQuestion> questionMap = new HashMap<>();
        for (QuizQuestion q : dbQuestions) {
            questionMap.put(q.getId(), q);
        }

        int correct = 0;
        List<AnswerResultDetail> details = new ArrayList<>();

        for (SubmitQuizRequest.AnswerSubmission ans : request.answers()) {
            String correctAnswer = null;
            String questionText = null;

            try {
                UUID qid = UUID.fromString(ans.questionId());
                QuizQuestion question = questionMap.get(qid);
                if (question != null) {
                    correctAnswer = question.getCorrectAnswer();
                    questionText = question.getQuestionText();

                    QuizAnswer answer = QuizAnswer.builder()
                            .question(question)
                            .selectedAnswer(ans.selectedAnswer())
                            .isCorrect(normalize(correctAnswer).equals(normalize(ans.selectedAnswer())))
                            .answeredAt(java.time.Instant.now())
                            .build();
                    attempt.addAnswer(answer);
                }
            } catch (IllegalArgumentException ignored) {}

            String ca = correctAnswer != null ? correctAnswer : "";
            boolean isCorrect = !ca.isBlank() && normalize(ca).equals(normalize(ans.selectedAnswer()));
            if (isCorrect) correct++;

            details.add(new AnswerResultDetail(
                    ans.questionId(),
                    questionText != null ? questionText : "",
                    ca,
                    ans.selectedAnswer(),
                    isCorrect
            ));
        }

        int total = request.answers().size();
        attempt.setTotalQuestions(total);
        attempt.setCorrectAnswers(correct);
        attempt.setScore(total > 0 ? (double) correct / total : 0.0);
        attempt.setTimeTakenSeconds(request.timeTakenSeconds());
        attempt.finish();

        // XP: only for approved quizzes + not owner (competitive play)
        int xpEarned = 0;
        if (qualifiesForLeaderboard) {
            xpEarned = correct * 10;
            if (correct == total && total > 0) {
                xpEarned += 20; // perfect bonus
            }

            if (xpEarned > 0) {
                User user = attempt.getUser();
                user.setXp(user.getXp() + xpEarned);
                userRepository.save(user);

                LocalDate today = LocalDate.now(ZoneOffset.UTC);
                DailyActivityId daId = new DailyActivityId(principal.getId(), today);
                DailyActivity activity = dailyActivityRepository.findById(daId)
                        .orElseGet(() -> new DailyActivity(principal.getId(), today));
                activity.setQuizTaken(activity.getQuizTaken() + 1);
                activity.setXpEarned(activity.getXpEarned() + xpEarned);
                dailyActivityRepository.save(activity);

                // Update streak
                streakService.recordStudyActivity(principal.getId());
            }
        }

        attempt.setXpEarned(xpEarned);
        attempt = quizAttemptRepository.save(attempt);

        // Update quiz stats
        if (quiz != null && qualifiesForLeaderboard) {
            updateQuizStats(quiz.getId());
        }

        // Invalidate Redis session
        quizSessionService.invalidateSession(request.attemptId(), principal.getId().toString());

        return QuizResultResponse.from(attempt, details);
    }

    // ============================================================
    // SESSION RESUME (timer persistence)
    // ============================================================

    @Transactional(readOnly = true)
    public QuizSessionResumeResponse resumeSession(UserPrincipal principal, UUID attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (!attempt.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("This is not your quiz attempt");
        }

        if (attempt.getFinishedAt() != null) {
            // Already submitted
            return QuizSessionResumeResponse.notFound();
        }

        return quizSessionService.resumeSession(attemptId.toString(), principal.getId().toString())
                .map(QuizSessionResumeResponse::from)
                .orElse(QuizSessionResumeResponse.notFound());
    }

    public void extendSession(UserPrincipal principal, UUID attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (!attempt.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("This is not your quiz attempt");
        }

        Quiz quiz = attempt.getQuiz();
        quizSessionService.extendSession(attemptId.toString(),
                quiz != null ? quiz.getTimeLimitSeconds() : null);
    }

    // ============================================================
    // RESULTS
    // ============================================================

    @Transactional(readOnly = true)
    public QuizResultResponse getAttemptResult(UUID attemptId, UserPrincipal principal) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (!attempt.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("You can only view your own attempts");
        }

        List<QuizAnswer> answers = quizAnswerRepository.findByAttemptId(attemptId);
        List<AnswerResultDetail> details = answers.stream()
                .map(a -> new AnswerResultDetail(
                        a.getQuestion().getId().toString(),
                        a.getQuestion().getQuestionText(),
                        a.getQuestion().getCorrectAnswer(),
                        a.getSelectedAnswer(),
                        a.getIsCorrect()
                ))
                .toList();

        return QuizResultResponse.from(attempt, details);
    }

    @Transactional(readOnly = true)
    public PageResponse<QuizAttemptSummaryResponse> getMyAttemptHistory(UserPrincipal principal, Pageable pageable) {
        Page<QuizAttempt> page = quizAttemptRepository.findByUserIdOrderByStartedAtDesc(principal.getId(), pageable);
        return PageResponse.from(page, QuizAttemptSummaryResponse::from);
    }

    /**
     * Get all active (in-progress, not yet submitted) quiz sessions for a user.
     * Used by Dashboard to show resume banners.
     */
    @Transactional(readOnly = true)
    public List<ActiveQuizSessionResponse> getActiveSessions(UserPrincipal principal) {
        List<String> activeAttemptIds = quizSessionService.getActiveSessionIds(principal.getId().toString());
        if (activeAttemptIds.isEmpty()) {
            return Collections.emptyList();
        }

        return activeAttemptIds.stream().map(idStr -> {
            UUID attemptId = UUID.fromString(idStr);
            Optional<QuizAttempt> attemptOpt = quizAttemptRepository.findById(attemptId);
            if (attemptOpt.isEmpty()) return null;

            QuizAttempt attempt = attemptOpt.get();
            if (!attempt.getUser().getId().equals(principal.getId())) return null;
            if (attempt.getFinishedAt() != null) return null;

            Quiz quiz = attempt.getQuiz();
            var resumeData = quizSessionService.resumeSession(idStr, principal.getId().toString()).orElse(null);
            int remaining = resumeData != null ? resumeData.remainingSeconds() : -1;

            return new ActiveQuizSessionResponse(
                    attempt.getId(),
                    quiz != null ? quiz.getId() : null,
                    quiz != null ? quiz.getTitle() : null,
                    quiz != null ? quiz.getTimeLimitSeconds() : null,
                    resumeData != null ? resumeData.startedAtEpochSecond() : attempt.getStartedAt().getEpochSecond(),
                    remaining
            );
        }).filter(Objects::nonNull).toList();
    }

    // ============================================================
    // LEADERBOARD
    // ============================================================

    @Transactional(readOnly = true)
    public List<QuizLeaderboardEntry> getQuizLeaderboard(UUID quizId, int limit) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        if (quiz.getStatus() != Quiz.QuizStatus.APPROVED) {
            throw new BadRequestException("Leaderboard is only available for approved quizzes");
        }

        List<QuizAttempt> topAttempts = quizAttemptRepository
                .findBestAttemptsPerUser(quizId, PageRequest.of(0, limit));

        Map<UUID, QuizLeaderboardEntry> bestPerUser = new LinkedHashMap<>();

        for (QuizAttempt attempt : topAttempts) {
            UUID uid = attempt.getUser().getId();
            bestPerUser.putIfAbsent(uid, QuizLeaderboardEntry.from(attempt,
                    attempt.getUser().getUsername()));
        }

        return new ArrayList<>(bestPerUser.values());
    }

    // ============================================================
    // ADMIN MODERATION
    // ============================================================

    @Transactional(readOnly = true)
    public PageResponse<QuizModerationResponse> listPendingQuizzes(Pageable pageable) {
        Page<Quiz> page = quizRepository.findPendingForModeration(Quiz.QuizStatus.PENDING, pageable);
        return PageResponse.from(page, QuizModerationResponse::from);
    }

    @Transactional
    public QuizSummaryResponse moderateQuiz(UserPrincipal principal, ModerateQuizRequest request) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Admin access required");
        }

        Quiz quiz = quizRepository.findById(request.quizId())
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        if (quiz.getStatus() == Quiz.QuizStatus.APPROVED) {
            throw new BadRequestException("Quiz is already approved");
        }

        switch (request.action().toUpperCase()) {
            case "APPROVE" -> {
                quiz.setStatus(Quiz.QuizStatus.APPROVED);
                quiz.setRejectionNote(null);
                quiz.setIsPublic(true);
            }
            case "REJECT" -> {
                quiz.setStatus(Quiz.QuizStatus.REJECTED);
                quiz.setRejectionNote(request.note());
                quiz.setIsPublic(false);
            }
            default -> throw new BadRequestException("Invalid action: use APPROVE or REJECT");
        }

        quiz = quizRepository.save(quiz);
        return QuizSummaryResponse.from(quiz);
    }

    @Transactional(readOnly = true)
    public long countPending() {
        return quizRepository.countByStatus(Quiz.QuizStatus.PENDING);
    }

    // ============================================================
    // IMPORT FROM CSV — admin only
    // ============================================================

    /**
     * Import a quiz from raw CSV content.
     * Format (6 columns, no header):
     *   question_text, correct_answer, option1, option2, option3, option4
     *
     * If option4 is blank → FILL_IN (no options).
     * If only 3 options → TRUE_FALSE.
     * Otherwise → MULTIPLE_CHOICE.
     *
     * Admin is the owner, quiz is immediately APPROVED.
     */
    @Transactional
    public ImportQuizResponse importFromCsv(UserPrincipal principal, ImportQuizRequest request) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Admin access required");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Quiz quiz = Quiz.builder()
                .title(request.title())
                .description(request.description())
                .coverImageUrl(request.coverImageUrl())
                .deck(null)
                .ownerId(principal.getId())
                .ownerUsername(user.getUsername())
                .quizType(Quiz.QuizType.IMPORTED)
                .isImmutable(true)
                .isPublic(true)
                .status(Quiz.QuizStatus.APPROVED)
                .timeLimitSeconds(request.timeLimitSeconds())
                .questionCount(0)
                .build();
        quiz = quizRepository.save(quiz);

        int skipped = 0;
        List<QuizQuestion> questions = new ArrayList<>();
        String[] lines = request.csvContent().split("\\r?\\n");

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isBlank()) continue;

            String[] cols = parseCsvLine(line);
            if (cols.length < 2) {
                skipped++;
                continue;
            }

            QuizQuestion q = buildQuestionFromRow(quiz, cols, i);
            if (q != null) {
                questions.add(q);
            } else {
                skipped++;
            }
        }

        if (!questions.isEmpty()) {
            quizQuestionRepository.saveAll(questions);
            quiz.setQuestionCount(questions.size());
            quiz = quizRepository.save(quiz);
        }

        String msg = skipped == 0
                ? "Import successful"
                : "Import completed with " + skipped + " skipped row(s)";
        return ImportQuizResponse.from(quiz, skipped, msg);
    }

    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.add(field.toString().trim());
                field = new StringBuilder();
            } else {
                field.append(c);
            }
        }
        fields.add(field.toString().trim());
        return fields.toArray(new String[0]);
    }

    private QuizQuestion buildQuestionFromRow(Quiz quiz, String[] cols, int index) {
        String questionText = cols[0].trim();
        String correctAnswer = cols[1].trim();
        if (questionText.isBlank() || correctAnswer.isBlank()) return null;

        String o1 = cols.length > 2 ? cols[2].trim() : "";
        String o2 = cols.length > 3 ? cols[3].trim() : "";
        String o3 = cols.length > 4 ? cols[4].trim() : "";
        String o4 = cols.length > 5 ? cols[5].trim() : "";

        QuizQuestion.QuestionType type;
        List<String> options = new ArrayList<>();

        if (o4.isBlank() && o3.isBlank() && o2.isBlank() && o1.isBlank()) {
            type = QuizQuestion.QuestionType.FILL_IN;
            options = Collections.emptyList();
        } else if (o4.isBlank() && o3.isBlank()) {
            type = QuizQuestion.QuestionType.TRUE_FALSE;
            options = List.of(o1.isBlank() ? "True" : o1, o2.isBlank() ? "False" : o2);
        } else {
            type = QuizQuestion.QuestionType.MULTIPLE_CHOICE;
            if (!o1.isBlank()) options.add(o1);
            if (!o2.isBlank()) options.add(o2);
            if (!o3.isBlank()) options.add(o3);
            if (!o4.isBlank()) options.add(o4);
            if (!options.contains(correctAnswer)) options.add(correctAnswer);
        }

        String optionsJson = "[]";
        if (!options.isEmpty()) {
            try { optionsJson = objectMapper.writeValueAsString(options); }
            catch (Exception ignored) {}
        }

        return QuizQuestion.builder()
                .quiz(quiz)
                .questionType(type)
                .questionText(questionText)
                .correctAnswer(correctAnswer)
                .options(optionsJson)
                .sortOrder(index)
                .build();
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private Quiz findOwnedQuiz(UserPrincipal principal, UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        if (!quiz.getOwnerId().equals(principal.getId())) {
            throw new ForbiddenException("You can only manage your own quizzes");
        }
        return quiz;
    }

    private void assertMutable(Quiz quiz) {
        if (Boolean.TRUE.equals(quiz.getIsImmutable())) {
            throw new BadRequestException("This quiz is immutable and cannot be modified");
        }
    }

    private QuizDetailResponse buildDetailResponse(Quiz quiz) {
        List<QuizQuestion> questions = quizQuestionRepository.findByQuizIdOrderBySortOrderAsc(quiz.getId());
        List<QuizQuestionResponse> questionResponses = questions.stream()
                .map(q -> {
                    List<String> opts = parseOptions(q.getOptions());
                    return new QuizQuestionResponse(
                            q.getId(),
                            q.getQuestionType().name(),
                            q.getQuestionText(),
                            q.getCorrectAnswer(),
                            opts,
                            q.getSortOrder()
                    );
                })
                .toList();

        return QuizDetailResponse.from(quiz, questionResponses);
    }

    private List<QuizQuestion> generateQuestions(Quiz quiz, List<Card> cards, int count) {
        List<Card> pool = new ArrayList<>(cards);
        Collections.shuffle(pool);
        int size = Math.min(count, pool.size());

        List<String> allBacks = cards.stream()
                .map(Card::getBack)
                .filter(b -> b != null && !b.isBlank())
                .distinct()
                .collect(Collectors.toCollection(ArrayList::new));

        List<QuizQuestion> questions = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            Card card = pool.get(i);
            String correct = card.getBack();
            String front = card.getFront();

            List<String> wrong = allBacks.stream()
                    .filter(b -> !b.equalsIgnoreCase(correct))
                    .filter(b -> !b.equalsIgnoreCase(front))
                    .filter(b -> !similarString(b.toLowerCase(), correct.toLowerCase()))
                    .limit(3)
                    .collect(Collectors.toCollection(ArrayList::new));

            while (wrong.size() < 3) {
                wrong.add("Option " + (wrong.size() + 1));
            }
            Collections.shuffle(wrong);

            List<String> options = new ArrayList<>(wrong);
            options.add(correct);
            Collections.shuffle(options);

            String optionsJson;
            try {
                optionsJson = objectMapper.writeValueAsString(options);
            } catch (Exception e) {
                optionsJson = "[]";
            }

            QuizQuestion question = QuizQuestion.builder()
                    .quiz(quiz)
                    .card(card)
                    .questionType(QuizQuestion.QuestionType.MULTIPLE_CHOICE)
                    .questionText(front)
                    .correctAnswer(correct)
                    .options(optionsJson)
                    .sortOrder(i)
                    .build();

            questions.add(question);
        }

        return quizQuestionRepository.saveAll(questions);
    }

    private List<String> parseOptions(String optionsJson) {
        if (optionsJson == null || optionsJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(optionsJson, new com.fasterxml.jackson.core.type.TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private void updateQuizStats(UUID quizId) {
        Optional<Double> avg = quizAttemptRepository.findAvgScoreByQuizId(quizId);
        avg.ifPresent(average -> quizRepository.updateStats(quizId, average));
    }

    private boolean similarString(String a, String b) {
        if (a.equals(b)) return true;
        if (Math.abs(a.length() - b.length()) > 5) return false;
        int distance = levenshteinDistance(a, b);
        int maxLen = Math.max(a.length(), b.length());
        return 1.0 - (double) distance / maxLen > 0.7;
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

    private String normalize(String text) {
        if (text == null) return "";
        return text.trim().toLowerCase()
                .replaceAll("[\\u2018\\u2019]", "'")
                .replaceAll("[\\u201C\\u201D]", "\"");
    }
}
