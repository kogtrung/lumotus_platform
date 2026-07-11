package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.*;
import com.backend.lumotus.dto.response.*;
import com.backend.lumotus.entity.*;
import com.backend.lumotus.exception.BadRequestException;
import com.backend.lumotus.exception.ForbiddenException;
import com.backend.lumotus.exception.QuizCooldownException;
import com.backend.lumotus.exception.ResourceNotFoundException;
import com.backend.lumotus.config.AppProperties;
import com.backend.lumotus.repository.*;
import com.backend.lumotus.security.UserPrincipal;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.backend.lumotus.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final QuizSessionRepository quizSessionRepository;
    private final UserRepository userRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final QuizSessionService quizSessionService;
    private final StreakService streakService;
    private final LeaderboardService leaderboardService;
    private final QuizCooldownService quizCooldownService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ============================================================
    // ADMIN: CREATE & MANAGE QUIZZES
    // ============================================================

    /**
     * Admin creates a quiz with manual questions (no deck).
     */
    @Transactional
    public QuizDetailResponse createEmptyQuiz(UserPrincipal principal, CreateQuizRequest request) {
        if (!"ADMIN".equals(principal.getRole())) {
            throw new ForbiddenException("Only admin can create quizzes");
        }

        User admin = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Quiz quiz = Quiz.builder()
                .title(request.title())
                .description(request.description())
                .coverImageUrl(request.coverImageUrl())
                .deck(null)
                .ownerId(principal.getId())
                .ownerUsername(admin.getUsername())
                .quizType(Quiz.QuizType.IMPORTED)
                .isImmutable(false)
                .isPublic(false)
                .status(Quiz.QuizStatus.DRAFT)
                .timeLimitSeconds(request.timeLimitSeconds())
                .questionCount(0)
                .slug(generateUniqueSlug(request.title(), principal.getId()))
                .build();

        quiz = quizRepository.save(quiz);
        return buildDetailResponse(quiz);
    }

    @Transactional
    public QuizDetailResponse updateQuiz(String quizRef, UpdateQuizRequest request) {
        Quiz quiz = findByIdOrSlug(quizRef);

        if (request.title() != null) quiz.setTitle(request.title());
        if (request.description() != null) quiz.setDescription(request.description());
        if (request.coverImageUrl() != null) quiz.setCoverImageUrl(request.coverImageUrl());
        if (request.timeLimitSeconds() != null) quiz.setTimeLimitSeconds(request.timeLimitSeconds());
        if (request.questionCount() != null) quiz.setQuestionCount(request.questionCount());

        quiz = quizRepository.save(quiz);
        return buildDetailResponse(quiz);
    }

    @Transactional
    public void deleteQuiz(String quizRef) {
        Quiz quiz = findByIdOrSlug(quizRef);
        deleteQuizDependencies(quiz.getId());
        quizRepository.delete(quiz);
    }

    // ============================================================
    // ADMIN: QUESTION MANAGEMENT
    // ============================================================

    @Transactional
    public void addQuestion(String quizRef, AddQuestionRequest request) {
        Quiz quiz = findByIdOrSlug(quizRef);

        List<String> optionsList = request.options() != null ? request.options() : List.of();

        // Strip prefix from options before saving
        List<String> strippedOptions = new ArrayList<>();
        for (String opt : optionsList) {
            strippedOptions.add(stripLetterPrefix(opt));
        }

        // Map letter (A/B/C/D) to option text if needed
        String rawAnswer = request.correctAnswer() != null ? request.correctAnswer() : "";
        String correctAnswer;
        String upper = rawAnswer.toUpperCase();
        if (upper.matches("^[A-D]$")) {
            int idx = upper.charAt(0) - 'A';
            if (idx >= 0 && idx < strippedOptions.size()) {
                correctAnswer = strippedOptions.get(idx);
            } else {
                correctAnswer = rawAnswer;
            }
        } else {
            correctAnswer = stripLetterPrefix(rawAnswer);
        }

        int maxSort = quiz.getQuestions().stream()
                .mapToInt(QuizQuestion::getSortOrder)
                .max()
                .orElse(0);

        String optionsJson = "[]";
        try {
            optionsJson = objectMapper.writeValueAsString(strippedOptions);
        } catch (Exception ignored) {}

        QuizQuestion question = QuizQuestion.builder()
                .quiz(quiz)
                .questionText(request.questionText())
                .questionType(QuizQuestion.QuestionType.valueOf(
                        request.questionType() != null ? request.questionType() : "MULTIPLE_CHOICE"))
                .options(optionsJson)
                .correctAnswer(correctAnswer)
                .sortOrder(maxSort + 1)
                .build();

        quizQuestionRepository.save(question);
        quiz.setQuestionCount(quiz.getQuestions().size() + 1);
        quizRepository.save(quiz);
    }

    @Transactional
    public void updateQuestion(String quizRef, UUID questionId, UpdateQuestionRequest request) {
        QuizQuestion question = quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));

        if (!question.getQuiz().getId().equals(findByIdOrSlug(quizRef).getId())) {
            throw new BadRequestException("Question does not belong to this quiz");
        }

        question.setQuestionText(request.questionText());

        // Strip prefix from options before saving
        List<String> opts = request.options() != null ? request.options()
            : parseOptions(question.getOptions());
        List<String> strippedOpts = new ArrayList<>();
        for (String opt : opts) {
            strippedOpts.add(stripLetterPrefix(opt));
        }

        String rawAnswer = request.correctAnswer() != null ? request.correctAnswer() : "";
        String correctAnswer;
        String upper = rawAnswer.toUpperCase();
        if (upper.matches("^[A-D]$")) {
            int idx = upper.charAt(0) - 'A';
            if (idx >= 0 && idx < strippedOpts.size()) {
                correctAnswer = strippedOpts.get(idx);
            } else {
                correctAnswer = rawAnswer;
            }
        } else {
            correctAnswer = stripLetterPrefix(rawAnswer);
        }
        question.setCorrectAnswer(correctAnswer);

        if (request.options() != null && !request.options().isEmpty()) {
            try {
                question.setOptions(objectMapper.writeValueAsString(strippedOpts));
            } catch (Exception ignored) {}
        }
        if (request.questionType() != null) {
            question.setQuestionType(QuizQuestion.QuestionType.valueOf(request.questionType()));
        }
        quizQuestionRepository.save(question);
    }

    @Transactional
    public void deleteQuestion(String quizRef, UUID questionId) {
        Quiz quiz = findByIdOrSlug(quizRef);
        QuizQuestion question = quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found"));
        if (!question.getQuiz().getId().equals(quiz.getId())) {
            throw new BadRequestException("Question does not belong to this quiz");
        }
        quizQuestionRepository.delete(question);
        quiz.setQuestionCount(Math.max(0, quiz.getQuestions().size() - 1));
        quizRepository.save(quiz);
    }

    // ============================================================
    // ADMIN: PUBLISH / APPROVE
    // ============================================================

    @Transactional
    public QuizSummaryResponse publishQuiz(String quizRef) {
        Quiz quiz = findByIdOrSlug(quizRef);

        if (quiz.getQuestions().isEmpty()) {
            throw new BadRequestException("Quiz must have at least one question to publish");
        }

        quiz.setStatus(Quiz.QuizStatus.APPROVED);
        quiz.setIsPublic(true);
        quiz.setQuestionCount(quiz.getQuestions().size());
        quiz = quizRepository.save(quiz);

        return QuizSummaryResponse.from(quiz);
    }

    @Transactional
    public QuizSummaryResponse unpublishQuiz(String quizRef) {
        Quiz quiz = findByIdOrSlug(quizRef);

        quiz.setStatus(Quiz.QuizStatus.DRAFT);
        quiz.setIsPublic(false);
        quiz = quizRepository.save(quiz);

        return QuizSummaryResponse.from(quiz);
    }

    // ============================================================
    // PUBLIC EXPLORE — APPROVED quizzes only
    // ============================================================

    @Transactional(readOnly = true)
    public PageResponse<QuizSummaryResponse> listExploreQuizzes(Pageable pageable, String sort, UserPrincipal principal) {
        UUID currentUserId = principal != null ? principal.getId() : null;
        Page<Quiz> page;
        if ("popular".equals(sort)) {
            page = quizRepository.findExplorePopular(Quiz.QuizStatus.APPROVED, pageable);
        } else if ("trending".equals(sort)) {
            page = quizRepository.findExploreTrending(Quiz.QuizStatus.APPROVED, pageable);
        } else {
            page = quizRepository.findExploreNewest(Quiz.QuizStatus.APPROVED, pageable);
        }
        page.forEach(q -> q.setComputedQuestionCount(
            quizRepository.countQuestionsByQuizId(q.getId()) != null
                ? quizRepository.countQuestionsByQuizId(q.getId())
                : q.getQuestionCount() != null ? q.getQuestionCount() : 0
        ));
        if (currentUserId != null) {
            page = new org.springframework.data.domain.PageImpl<>(
                    page.getContent().stream()
                            .filter(q -> !currentUserId.equals(q.getOwnerId()))
                            .toList(),
                    pageable,
                    page.getTotalElements()
            );
        }
        return PageResponse.from(page, QuizSummaryResponse::from);
    }

    public PageResponse<QuizSummaryResponse> listExploreQuizzes(Pageable pageable, String sort) {
        return listExploreQuizzes(pageable, sort, null);
    }

    @Transactional(readOnly = true)
    public PageResponse<QuizSummaryResponse> listExploreQuizzes(Pageable pageable) {
        return listExploreQuizzes(pageable, "newest");
    }

    @Transactional(readOnly = true)
    public QuizDetailResponse getExploreQuiz(String quizRef) {
        Quiz quiz = findByIdOrSlug(quizRef);

        if (quiz.getStatus() != Quiz.QuizStatus.APPROVED) {
            throw new ResourceNotFoundException("Quiz not found");
        }

        return buildDetailResponse(quiz);
    }

    @Transactional(readOnly = true)
    public PageResponse<QuizSummaryResponse> listQuizzesByDeck(UUID deckId, Pageable pageable) {
        Page<Quiz> page = quizRepository.findByDeckIdOrderByCreatedAtDesc(deckId, pageable);
                return PageResponse.from(page, QuizSummaryResponse::from);
    }

    /**
     * Admin can view any quiz (regardless of status).
     */
    @Transactional(readOnly = true)
    public QuizDetailResponse getAdminQuiz(String quizRef) {
        Quiz quiz = findByIdOrSlug(quizRef);
        return buildDetailResponse(quiz);
    }

    // ============================================================
    // START QUIZ SESSION
    // ============================================================

    @Transactional
    public StartQuizResponse startQuiz(UserPrincipal principal, UUID quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));

        return doStartQuiz(principal, quiz);
    }

    @Transactional
    public StartQuizResponse startQuiz(UserPrincipal principal, String quizRef) {
        Quiz quiz = findByIdOrSlug(quizRef);
        return doStartQuiz(principal, quiz);
    }

    private StartQuizResponse doStartQuiz(UserPrincipal principal, Quiz quiz) {
        String userIdStr = principal.getId().toString();

        // Only APPROVED quizzes can be played
        if (quiz.getStatus() != Quiz.QuizStatus.APPROVED) {
            throw new ResourceNotFoundException("Quiz not found");
        }

        // --- Cooldown check ---
        CooldownCheckResult cooldown = quizCooldownService.checkCooldown(principal.getId(), quiz.getId());
        if (!cooldown.allowed()) {
            throw new QuizCooldownException(cooldown.message(), cooldown);
        }

        // Expire old sessions
        List<String> activeSessionIds = quizSessionService.getActiveSessionIds(userIdStr);
        if (!activeSessionIds.isEmpty()) {
            log.info("User {} has {} active quiz sessions. Expiring all.", userIdStr, activeSessionIds.size());
            quizSessionService.expireAllActiveSessions(userIdStr);
        }

        // Close all unsubmitted attempts in DB
        quizAttemptRepository.closeAllUnsubmittedByUser(principal.getId());

        List<QuizQuestion> questions = quizQuestionRepository.findByQuizIdOrderBySortOrderAsc(quiz.getId());
        if (questions.isEmpty()) {
            throw new BadRequestException("Quiz has no questions");
        }

        // Shuffle questions
        List<QuizQuestion> shuffledQuestions = new ArrayList<>(questions);
        Collections.shuffle(shuffledQuestions);

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Create QuizAttempt
        QuizAttempt attempt = QuizAttempt.builder()
                .user(user)
                .quiz(quiz)
                .status(QuizAttempt.AttemptStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .totalQuestions(shuffledQuestions.size())
                .build();
        attempt = quizAttemptRepository.save(attempt);

        // Create QuizSession record in DB
        QuizSession session = QuizSession.builder()
                .attempt(attempt)
                .userId(principal.getId())
                .quizId(quiz.getId())
                .status(QuizSession.SessionStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .lastActivity(Instant.now())
                .build();
        quizSessionRepository.save(session);

        // Store session in Redis
        quizSessionService.startSession(
                attempt.getId().toString(),
                userIdStr,
                attempt.getStartedAt(),
                quiz.getTimeLimitSeconds()
        );

        // Shuffle options for each question and build responses
        List<QuizQuestionResponse> questionResponses = new ArrayList<>();
        // Store mapping: questionId -> shuffle mapping like "A:0,B:2,C:1,D:3"
        // Meaning: display letter A = original index 0, display letter B = original index 2, etc.
        Map<String, String> shuffleMappings = new HashMap<>();
        String[] displayLetters = {"A", "B", "C", "D"};

        for (QuizQuestion q : shuffledQuestions) {
            List<String> originalOptions = parseOptions(q.getOptions());

            // Shuffle options randomly
            List<Integer> shuffleOrder = new ArrayList<>();
            for (int i = 0; i < originalOptions.size(); i++) shuffleOrder.add(i);
            Collections.shuffle(shuffleOrder);

            // Create shuffled options list (strip prefix from display)
            List<String> shuffledOptions = new ArrayList<>();
            for (int originalIndex : shuffleOrder) {
                shuffledOptions.add(stripLetterPrefix(originalOptions.get(originalIndex)));
            }

            // Find correct answer TEXT from options
            // If correct_answer is a letter (A/B/C/D), find corresponding option text
            // If correct_answer is already text, use it directly
            String rawCorrect = q.getCorrectAnswer();
            String correctAnswer;
            
            String upperRaw = rawCorrect != null ? rawCorrect.toUpperCase().trim() : "";
            if (upperRaw.matches("^[A-D]$")) {
                // It's a letter - find the corresponding option text
                int idx = upperRaw.charAt(0) - 'A';
                if (idx >= 0 && idx < originalOptions.size()) {
                    correctAnswer = stripLetterPrefix(originalOptions.get(idx));
                } else {
                    correctAnswer = rawCorrect;
                }
            } else {
                // It's already text
                correctAnswer = stripLetterPrefix(rawCorrect);
            }

            // Build mapping: displayLetter -> originalIndex (for reference only)
            StringBuilder mapping = new StringBuilder();
            for (int i = 0; i < shuffleOrder.size(); i++) {
                if (i > 0) mapping.append(",");
                mapping.append(displayLetters[i]).append(":").append(shuffleOrder.get(i));
            }
            shuffleMappings.put(q.getId().toString(), mapping.toString());

            // Return correct answer as TEXT only (no letter prefix)
            questionResponses.add(new QuizQuestionResponse(
                    q.getId(),
                    q.getQuestionType().name(),
                    q.getQuestionText(),
                    correctAnswer,
                    shuffledOptions,
                    q.getSortOrder()
            ));
        }

        // Store all shuffle mappings in Redis
        quizSessionService.setQuestionShuffles(attempt.getId().toString(), shuffleMappings);

        // Store shuffled question order in Redis
        List<String> questionOrder = shuffledQuestions.stream()
                .map(q -> q.getId().toString())
                .toList();
        quizSessionService.setQuestionOrder(attempt.getId().toString(), questionOrder);

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
    // AUTO-SAVE ANSWERS
    // ============================================================

    @Transactional
    public void saveAnswer(UserPrincipal principal, UUID attemptId, SaveAnswerRequest request) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (!attempt.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("This is not your quiz attempt");
        }

        if (attempt.getStatus() != QuizAttempt.AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Quiz is already completed");
        }

        // Validate session ownership
        if (!quizSessionService.validateSessionOwnership(attemptId.toString(), principal.getId().toString())) {
            throw new BadRequestException("Invalid session");
        }

        // Just save the selected letter (A/B/C/D) directly
        // No need to map - we'll compare letters in submitQuiz
        quizSessionService.saveAnswer(
                attemptId.toString(),
                request.questionId(),
                request.answer(),
                Instant.now()
        );

        // If user answers a skipped question, clear the skipped marker
        quizSessionService.unmarkQuestionSkipped(attemptId.toString(), request.questionId());

        // Update session last_activity in DB
        quizSessionRepository.updateLastActivity(attemptId, Instant.now());
    }

    @Transactional
    public void syncOfflineAnswers(UserPrincipal principal, UUID attemptId, SyncAnswersRequest request) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (!attempt.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("This is not your quiz attempt");
        }

        if (attempt.getStatus() != QuizAttempt.AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Quiz is already completed");
        }

        // Convert to OfflineAnswer list
        List<QuizSessionService.OfflineAnswer> offlineAnswers = request.answers().stream()
                .map(a -> new QuizSessionService.OfflineAnswer(
                        a.questionId(),
                        a.answer(),
                        a.answeredAt()
                ))
                .toList();

        // Sync to Redis
        quizSessionService.syncAnswers(attemptId.toString(), offlineAnswers);

        // Update session last_activity
        quizSessionRepository.updateLastActivity(attemptId, Instant.now());
    }

    @Transactional
    public void skipQuestion(UserPrincipal principal, UUID attemptId, SkipQuestionRequest request) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (!attempt.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("This is not your quiz attempt");
        }

        if (attempt.getStatus() != QuizAttempt.AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException("Quiz is already completed");
        }

        // Mark as skipped in Redis
        quizSessionService.markQuestionSkipped(attemptId.toString(), request.questionId());
    }

    // ============================================================
    // SUBMIT QUIZ
    // ============================================================

    @Transactional
    public QuizResultResponse submitQuiz(UserPrincipal principal, SubmitQuizRequest request) {
        if (request.attemptId() == null) {
            throw new BadRequestException("attemptId is required");
        }

        UUID attemptId = UUID.fromString(request.attemptId());
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz attempt not found"));

        if (!attempt.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("This is not your quiz attempt");
        }

        if (attempt.getStatus() == QuizAttempt.AttemptStatus.COMPLETED) {
            throw new BadRequestException("Quiz has already been submitted");
        }

        Quiz quiz = attempt.getQuiz();
        boolean isOwner = quiz != null && quiz.getOwnerId().equals(principal.getId());
        boolean isApproved = quiz != null && quiz.getStatus() == Quiz.QuizStatus.APPROVED;
        boolean qualifiesForXp = isApproved && !isOwner;
        // Note: Per-question timer is handled by frontend (30s per question)
        // Backend only validates attempt ownership, not session timing

        // Get all questions for this quiz
        List<QuizQuestion> dbQuestions = quiz != null
                ? quizQuestionRepository.findByQuizIdOrderBySortOrderAsc(quiz.getId())
                : Collections.emptyList();

        Map<UUID, QuizQuestion> questionMap = new HashMap<>();
        for (QuizQuestion q : dbQuestions) {
            questionMap.put(q.getId(), q);
        }

        // Get shuffled question order from Redis
        List<String> questionOrder = quizSessionService.getQuestionOrder(attemptId.toString());

        // Get answers from Redis (auto-saved)
        Map<String, QuizSessionService.SessionAnswerData> savedAnswers =
                quizSessionService.getSessionAnswers(attemptId.toString());

        // Get skipped questions
        Set<String> skippedQuestions = quizSessionService.getSkippedQuestions(attemptId.toString());

        // Build map of submitted answers
        Map<String, String> submittedAnswers = new HashMap<>();
        if (request.answers() != null) {
            for (SubmitQuizRequest.AnswerSubmission ans : request.answers()) {
                submittedAnswers.put(ans.questionId(), ans.selectedAnswer());
            }
        }

        int correct = 0;
        int skipped = 0;
        List<AnswerResultDetail> details = new ArrayList<>();

        // Use shuffled order if available, otherwise fall back to DB order
        List<QuizQuestion> orderedQuestions;
        if (!questionOrder.isEmpty() && questionOrder.size() == dbQuestions.size()) {
            // Reorder questions according to shuffled order
            Map<String, QuizQuestion> orderMap = new LinkedHashMap<>();
            for (String qId : questionOrder) {
                QuizQuestion q = questionMap.get(UUID.fromString(qId));
                if (q != null) {
                    orderMap.put(qId, q);
                }
            }
            orderedQuestions = new ArrayList<>(orderMap.values());
        } else {
            orderedQuestions = dbQuestions;
        }

        for (QuizQuestion question : orderedQuestions) {
            String qIdStr = question.getId().toString();

            // Get selected answer (TEXT directly from frontend)
            String submittedAnswer = submittedAnswers.get(qIdStr);
            String savedAnswer = null;
            QuizSessionService.SessionAnswerData savedData = savedAnswers.get(qIdStr);
            if (savedData != null) {
                savedAnswer = savedData.answer();
            }
            String selectedAnswerText = submittedAnswer != null ? submittedAnswer : savedAnswer;

            boolean isSkipped = selectedAnswerText == null || skippedQuestions.contains(qIdStr);

            // Get correct answer text (already clean from DB)
            String correctAnswerText = stripLetterPrefix(question.getCorrectAnswer());

            // Check if correct by comparing TEXT directly
            boolean isCorrect = false;
            if (!isSkipped && selectedAnswerText != null) {
                isCorrect = normalize(selectedAnswerText).equals(normalize(correctAnswerText));
                if (isCorrect) correct++;
            } else {
                skipped++;
            }

            // Save TEXT to DB
            QuizAnswer answer = QuizAnswer.builder()
                    .question(question)
                    .selectedAnswer(selectedAnswerText)
                    .isCorrect(isCorrect)
                    .answeredAt(Instant.now())
                    .build();
            attempt.addAnswer(answer);

            // Build display strings
            String displayCorrect = correctAnswerText;
            String displaySelected;
            if (isSkipped || selectedAnswerText == null) {
                displaySelected = "(bỏ qua)";
            } else if (isCorrect) {
                displaySelected = correctAnswerText;
            } else {
                displaySelected = selectedAnswerText;
            }

            // Parse options for display
            List<String> originalOptions = parseOptions(question.getOptions());
            List<String> strippedOptions = new ArrayList<>();
            for (String opt : originalOptions) {
                strippedOptions.add(stripLetterPrefix(opt));
            }

            details.add(new AnswerResultDetail(
                    qIdStr,
                    question.getQuestionText(),
                    displayCorrect,
                    displaySelected,
                    isCorrect,
                    strippedOptions,
                    null  // no letter needed when comparing text
            ));
        }

        int total = orderedQuestions.size();
        attempt.setTotalQuestions(total);
        attempt.setCorrectAnswers(correct);
        attempt.setSkippedAnswers(skipped);
        
        double newScoreRaw = total > 0 ? (double) correct / total : 0.0;

        // Fetch previous best BEFORE modifying attempt.setScore to avoid JPA pre-query flush including current attempt's score
        double previousBestRaw = quizAttemptRepository.findBestScoreByUserAndQuiz(principal.getId(), quiz.getId())
                .orElse(0.0);

        attempt.setScore(newScoreRaw);
        attempt.setTimeTakenSeconds(request.timeTakenSeconds());
        attempt.finish();

        // Calculate points gained for the Weekly Quiz Leaderboard
        double pointsGained = (newScoreRaw * 10.0) - (previousBestRaw * 10.0);
        if (pointsGained > 0) {
            leaderboardService.updateWeeklyQuizScore(principal.getId(), pointsGained);
        }

        // Calculate XP with deck multiplier
        int xpEarned = 0;
        if (qualifiesForXp) {
            int baseXp = quiz.getXpBase() != null ? quiz.getXpBase() : 10;
            int bonusXp = quiz.getXpBonus() != null ? quiz.getXpBonus() : 20;
            int rawXp = correct * baseXp + (correct == total && total > 0 ? bonusXp : 0);
            double multiplier = quiz.getDeck() != null ? quiz.getDeck().getXpMultiplier() : 1.0;
            xpEarned = applyXpMultiplier(rawXp, multiplier);
        }

        if (xpEarned > 0) {
            User user = attempt.getUser();
            user.setXp(user.getXp() + xpEarned);
            userRepository.save(user);
        }

        // DailyActivity & streak
        LocalDate today = LocalDate.now(AppProperties.APP_ZONE);
        DailyActivityId daId = new DailyActivityId(principal.getId(), today);
        DailyActivity activity = dailyActivityRepository.findById(daId)
                .orElseGet(() -> new DailyActivity(principal.getId(), today));
        activity.setQuizTaken(activity.getQuizTaken() + 1);
        activity.setStudyMinutes(activity.getStudyMinutes() + 5); // 5 mins per quiz
        activity.setXpEarned(activity.getXpEarned() + xpEarned);
        dailyActivityRepository.save(activity);
        streakService.recordStudyActivity(principal.getId());
        leaderboardService.updateUserScore(principal.getId());

        attempt.setXpEarned(xpEarned);
        attempt = quizAttemptRepository.save(attempt);

        // Update quiz stats
        if (quiz != null && qualifiesForXp) {
            updateQuizStats(quiz.getId());
        }

        // Complete session in DB
        quizSessionRepository.updateStatus(attemptId, QuizSession.SessionStatus.COMPLETED, Instant.now());

        // Invalidate Redis
        quizSessionService.invalidateSession(request.attemptId(), principal.getId().toString());

        return QuizResultResponse.from(attempt, details);
    }

    // ============================================================
    // QUIT / ABANDON SESSION
    // ============================================================

    @Transactional
    public QuizResultResponse quitQuiz(UserPrincipal principal, UUID attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (!attempt.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("This is not your quiz attempt");
        }

        int rows = quizAttemptRepository.closeAttemptById(attemptId);
        if (rows == 0) {
            log.info("User {} tried to quit already-closed attempt {} — ignored", principal.getId(), attemptId);
            return QuizResultResponse.from(attempt, Collections.emptyList());
        }

        // Update session status in DB
        quizSessionRepository.updateStatus(attemptId, QuizSession.SessionStatus.ABANDONED, Instant.now());

        // Invalidate Redis
        quizSessionService.invalidateSession(attemptId.toString(), principal.getId().toString());

        log.info("User {} quit quiz session {}", principal.getId(), attemptId);

        QuizAttempt updated = quizAttemptRepository.findById(attemptId).orElse(attempt);
        return QuizResultResponse.from(updated, Collections.emptyList());
    }

    // ============================================================
    // SESSION RESUME
    // ============================================================

    @Transactional(readOnly = true)
    public QuizSessionResumeResponse resumeSession(UserPrincipal principal, UUID attemptId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found"));

        if (!attempt.getUser().getId().equals(principal.getId())) {
            throw new ForbiddenException("This is not your quiz attempt");
        }

        if (attempt.getStatus() == QuizAttempt.AttemptStatus.COMPLETED) {
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
    // RESULTS & HISTORY
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
                .map(a -> {
                    // Get options for this question
                    List<String> opts = parseOptions(a.getQuestion().getOptions());
                    List<String> strippedOpts = new ArrayList<>();
                    for (String opt : opts) {
                        strippedOpts.add(stripLetterPrefix(opt));
                    }

                    // Correct answer is TEXT
                    String correctAnswerText = stripLetterPrefix(a.getQuestion().getCorrectAnswer());

                    // Selected answer is TEXT
                    String selectedAnswer = a.getSelectedAnswer();

                    // Build display - just TEXT, no letters
                    String displayCorrect = correctAnswerText;
                    String displaySelected;

                    if (selectedAnswer == null) {
                        displaySelected = "(bỏ qua)";
                    } else if (Boolean.TRUE.equals(a.getIsCorrect())) {
                        displaySelected = correctAnswerText;
                    } else {
                        displaySelected = selectedAnswer;
                    }

                    return new AnswerResultDetail(
                            a.getQuestion().getId().toString(),
                            a.getQuestion().getQuestionText(),
                            displayCorrect,
                            displaySelected,
                            a.getIsCorrect(),
                            strippedOpts,
                            null
                    );
                })
                .toList();

        return QuizResultResponse.from(attempt, details);
    }

    @Transactional(readOnly = true)
    public PageResponse<QuizAttemptSummaryResponse> getMyAttemptHistory(UserPrincipal principal, Pageable pageable) {
        Page<QuizAttempt> page = quizAttemptRepository.findByUserIdOrderByStartedAtDesc(principal.getId(), pageable);
        return PageResponse.from(page, QuizAttemptSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public List<ActiveQuizSessionResponse> getActiveSessions(UserPrincipal principal) {
        List<QuizAttempt> activeAttempts = quizAttemptRepository.findActiveByUserId(principal.getId());
        if (activeAttempts.isEmpty()) {
            return Collections.emptyList();
        }

        return activeAttempts.stream().map(attempt -> {
            Quiz quiz = attempt.getQuiz();
            var resumeData = quizSessionService.resumeSession(
                    attempt.getId().toString(), principal.getId().toString()).orElse(null);
            int remaining = resumeData != null ? resumeData.remainingSeconds() : -1;

            return new ActiveQuizSessionResponse(
                    attempt.getId(),
                    quiz != null ? quiz.getId() : null,
                    quiz != null ? quiz.getSlug() : null,
                    quiz != null ? quiz.getTitle() : null,
                    quiz != null ? quiz.getTimeLimitSeconds() : null,
                    resumeData != null ? resumeData.startedAtEpochSecond() : attempt.getStartedAt().getEpochSecond(),
                    remaining
            );
        }).toList();
    }

    // ============================================================
    // LEADERBOARD
    // ============================================================

    public List<com.backend.lumotus.dto.response.LeaderboardEntry> getWeeklyQuizLeaderboard(int limit) {
        return leaderboardService.getWeeklyTopUsers(limit);
    }

    public Optional<com.backend.lumotus.dto.response.LeaderboardEntry> getWeeklyUserEntry(UUID userId) {
        return leaderboardService.getWeeklyUserEntry(userId);
    }

    @Transactional(readOnly = true)
    public List<GlobalQuizLeaderboardEntry> getGlobalQuizLeaderboard(int limit) {
        List<Object[]> rows = quizAttemptRepository.findGlobalQuizLeaderboard(limit);
        long[] rankCounter = {1};
        return rows.stream().map(row -> new GlobalQuizLeaderboardEntry(
                (java.util.UUID) row[0],
                (String) row[1],
                !((String) row[2]).isEmpty() ? (String) row[2] : null,
                row[3] != null ? ((Number) row[3]).doubleValue() : 0.0,
                row[4] != null ? ((Number) row[4]).intValue() : 0,
                row[5] != null ? ((Number) row[5]).intValue() : 0,
                row[6] != null ? ((Number) row[6]).intValue() : 0,
                rankCounter[0]++
        )).toList();
    }

    @Transactional(readOnly = true)
    public Optional<GlobalQuizLeaderboardEntry> getGlobalUserEntry(UUID userId) {
        List<Object[]> rows = quizAttemptRepository.findGlobalQuizLeaderboardEntry(userId);
        if (rows.isEmpty()) {
            User user = userRepository.findById(userId).orElseThrow();
            return Optional.of(new GlobalQuizLeaderboardEntry(
                    userId,
                    user.getUsername(),
                    user.getAvatarUrl(),
                    0.0, 0, 0, 0, 0L
            ));
        }
        Object[] row = rows.get(0);
        return Optional.of(new GlobalQuizLeaderboardEntry(
                (java.util.UUID) row[0],
                (String) row[1],
                !((String) row[2]).isEmpty() ? (String) row[2] : null,
                row[3] != null ? ((Number) row[3]).doubleValue() : 0.0,
                row[4] != null ? ((Number) row[4]).intValue() : 0,
                row[5] != null ? ((Number) row[5]).intValue() : 0,
                row[6] != null ? ((Number) row[6]).intValue() : 0,
                row[7] != null ? ((Number) row[7]).longValue() : 0L
        ));
    }

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

    public List<QuizLeaderboardEntry> getQuizLeaderboard(String quizRef, int limit) {
        Quiz quiz = findByIdOrSlug(quizRef);
        return getQuizLeaderboard(quiz.getId(), limit);
    }

    // ============================================================
    // ADMIN MODERATION
    // ============================================================

    @Transactional(readOnly = true)
    public PageResponse<QuizSummaryResponse> listAllForAdmin(String status, Pageable pageable) {
        Quiz.QuizStatus quizStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                quizStatus = Quiz.QuizStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        Page<Quiz> page = quizRepository.findAllForAdmin(quizStatus, pageable);
        page.forEach(q -> {
            q.setComputedQuestionCount(
                quizRepository.countQuestionsByQuizId(q.getId()) != null
                    ? quizRepository.countQuestionsByQuizId(q.getId())
                    : q.getQuestionCount() != null ? q.getQuestionCount() : 0
            );
            long distinctUsers = quizAttemptRepository.countDistinctUsersByQuiz(q.getId());
            q.setUniqueUserCount(distinctUsers);
        });
        return PageResponse.from(page, QuizSummaryResponse::from);
    }

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

        switch (request.action().toUpperCase()) {
            case "APPROVE" -> {
                if (quiz.getStatus() == Quiz.QuizStatus.APPROVED) {
                    throw new BadRequestException("Quiz is already approved");
                }
                quiz.setStatus(Quiz.QuizStatus.APPROVED);
                quiz.setRejectionNote(null);
                // Only set isPublic if it wasn't already public (preserve existing public status)
                if (!quiz.getIsPublic()) {
                    quiz.setIsPublic(false);
                }
            }
            case "PUBLISH" -> {
                // Approve + make public in one action
                if (quiz.getStatus() != Quiz.QuizStatus.APPROVED) {
                    quiz.setStatus(Quiz.QuizStatus.APPROVED);
                    quiz.setRejectionNote(null);
                }
                quiz.setIsPublic(true);
            }
            case "UNPUBLISH" -> {
                quiz.setIsPublic(false);
            }
            case "REJECT" -> {
                quiz.setStatus(Quiz.QuizStatus.REJECTED);
                quiz.setRejectionNote(request.note());
                quiz.setIsPublic(false);
            }
            case "TOGGLE_PUBLIC" -> {
                quiz.setIsPublic(!quiz.getIsPublic());
            }
            case "DELETE" -> {
                quizRepository.delete(quiz);
                return QuizSummaryResponse.from(quiz);
            }
            default -> throw new BadRequestException("Invalid action: use APPROVE, PUBLISH, UNPUBLISH, REJECT, TOGGLE_PUBLIC, or DELETE");
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
                .isPublic(false)
                .status(Quiz.QuizStatus.DRAFT)
                .timeLimitSeconds(request.timeLimitSeconds())
                .questionCount(0)
                .slug(generateUniqueSlug(request.title(), principal.getId()))
                .build();
        quiz = quizRepository.save(quiz);

        int skipped = 0;
        List<QuizQuestion> questions = new ArrayList<>();
        int sortOrder = 0;
        String[] lines = request.csvContent().split("\\r?\\n");

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            String trimmed = line.trim();
            if (trimmed.isBlank()) continue;

            // Skip header row (first non-blank line that looks like CSV header)
            if (i == 0) {
                String lower = trimmed.toLowerCase();
                if (lower.contains("question") || lower.contains("option") || lower.contains("answer")) {
                    continue;
                }
            }

            String[] cols = parseCsvLine(trimmed);
            if (cols.length < 2) {
                skipped++;
                continue;
            }

            QuizQuestion q = buildQuestionFromRow(quiz, cols, sortOrder);
            if (q != null) {
                questions.add(q);
                sortOrder++;
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
        return ImportQuizResponse.from(quiz, questions, skipped, msg);
    }

    // ============================================================
    // PUBLIC HELPERS
    // ============================================================

    /**
     * Resolve quizRef (UUID or slug) to Quiz entity.
     * Used by QuizController for cooldown check.
     */
    @Transactional(readOnly = true)
    public Quiz findQuizByRef(String quizRef) {
        return findByIdOrSlug(quizRef);
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private Quiz findByIdOrSlug(String quizRef) {
        try {
            UUID uuid = UUID.fromString(quizRef);
            return quizRepository.findById(uuid)
                    .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        } catch (IllegalArgumentException e) {
            return quizRepository.findBySlug(quizRef)
                    .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
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
        String correctAnswerRaw = cols[1].trim();
        if (questionText.isBlank() || correctAnswerRaw.isBlank()) return null;

        String o1 = cols.length > 2 ? cols[2].trim() : "";
        String o2 = cols.length > 3 ? cols[3].trim() : "";
        String o3 = cols.length > 4 ? cols[4].trim() : "";
        String o4 = cols.length > 5 ? cols[5].trim() : "";

        QuizQuestion.QuestionType type;
        List<String> options = new ArrayList<>();

        if (o4.isBlank() && o3.isBlank() && o2.isBlank() && o1.isBlank()) {
            type = QuizQuestion.QuestionType.FILL_IN;
            options = Collections.emptyList();
            // For FILL_IN, answer is the text itself
        } else if (o4.isBlank() && o3.isBlank()) {
            type = QuizQuestion.QuestionType.TRUE_FALSE;
            String opt1 = o1.isBlank() ? "True" : stripLetterPrefix(o1);
            String opt2 = o2.isBlank() ? "False" : stripLetterPrefix(o2);
            options = List.of(opt1, opt2);
            // Map letter (A/B) to option text
            String upper = correctAnswerRaw.toUpperCase();
            if (upper.matches("^[A-B]$")) {
                int idx = upper.charAt(0) - 'A';
                List<String> opts = List.of(opt1, opt2);
                if (idx >= 0 && idx < opts.size()) {
                    correctAnswerRaw = opts.get(idx);
                }
            } else {
                correctAnswerRaw = stripLetterPrefix(correctAnswerRaw);
            }
        } else {
            type = QuizQuestion.QuestionType.MULTIPLE_CHOICE;
            // Strip prefix from each option before adding to list
            if (!o1.isBlank()) options.add(stripLetterPrefix(o1));
            if (!o2.isBlank()) options.add(stripLetterPrefix(o2));
            if (!o3.isBlank()) options.add(stripLetterPrefix(o3));
            if (!o4.isBlank()) options.add(stripLetterPrefix(o4));

            // Map letter (A/B/C/D) to actual option text
            String upper = correctAnswerRaw.toUpperCase();
            if (upper.matches("^[A-D]$")) {
                int idx = upper.charAt(0) - 'A';
                if (idx >= 0 && idx < options.size()) {
                    correctAnswerRaw = options.get(idx);
                }
            } else {
                // Answer is already text (no prefix), strip just in case
                correctAnswerRaw = stripLetterPrefix(correctAnswerRaw);
                // If the answer text is not in options, add it
                if (!options.contains(correctAnswerRaw)) {
                    options.add(correctAnswerRaw);
                }
            }
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
                .correctAnswer(correctAnswerRaw)
                .options(optionsJson)
                .sortOrder(index)
                .build();
    }

    private String stripLetterPrefix(String text) {
        if (text == null) return "";
        String trimmed = text.trim();
        if (trimmed.matches("^[A-D][.)]\\s+.*")) {
            return trimmed.replaceFirst("^[A-D][.)]\\s+", "");
        }
        return trimmed;
    }

    private static int applyXpMultiplier(int baseXp, double multiplier) {
        if (multiplier <= 0) {
            return 0;
        }
        double scaled = baseXp * multiplier;
        int rounded = (int) Math.ceil(scaled);
        return Math.max(rounded, 1);
    }

    private void updateQuizStats(UUID quizId) {
        Optional<Double> avg = quizAttemptRepository.findAvgScoreByQuizId(quizId);
        if (avg.isPresent()) {
            quizRepository.updateStats(quizId, avg.get());
        } else {
            quizRepository.incrementAttemptCount(quizId);
        }
    }

    private String normalize(String text) {
        if (text == null) return "";
        // Strip all letter prefixes: "A. ", "B. ", "C. ", "D. " or "A) ", "B) ", etc.
        String stripped = text.replaceFirst("^[A-D][.)]\\s+", "");
        return stripped.trim().toLowerCase()
                .replaceAll("[\\u2018\\u2019]", "'")
                .replaceAll("[\\u201C\\u201D]", "\"");
    }

    private void deleteQuizDependencies(UUID quizId) {
        List<QuizQuestion> questions = quizQuestionRepository.findByQuizIdOrderBySortOrderAsc(quizId);
        List<UUID> questionIds = questions.stream()
                .map(QuizQuestion::getId)
                .toList();

        for (UUID questionId : questionIds) {
            quizAnswerRepository.deleteByQuestionId(questionId);
        }

        List<UUID> attemptIds = quizAttemptRepository.findByQuizIdOrderByStartedAtDesc(quizId)
                .stream()
                .map(QuizAttempt::getId)
                .toList();

        for (UUID attemptId : attemptIds) {
            quizAnswerRepository.deleteByAttemptId(attemptId);
        }

        quizAttemptRepository.deleteByQuizId(quizId);
        quizQuestionRepository.deleteByQuizId(quizId);
    }

    private String generateUniqueSlug(String title, UUID ownerId) {
        String base = SlugUtils.slugify(title);
        String candidate = base;
        int suffix = 0;
        while (true) {
            Optional<Quiz> existing = quizRepository.findByOwnerIdAndSlug(ownerId, candidate);
            if (existing.isEmpty()) break;
            suffix++;
            candidate = base + "-" + suffix;
            if (suffix > 100) {
                candidate = base + "-" + UUID.randomUUID().toString().substring(0, 6);
                break;
            }
        }
        return candidate;
    }
}
