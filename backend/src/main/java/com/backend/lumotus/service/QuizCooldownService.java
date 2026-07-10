package com.backend.lumotus.service;

import com.backend.lumotus.config.AppProperties;
import com.backend.lumotus.dto.request.BypassCooldownRequest;
import com.backend.lumotus.dto.request.UpdateCooldownSettingsRequest;
import com.backend.lumotus.dto.response.CooldownCheckResult;
import com.backend.lumotus.dto.response.CooldownCheckResult.CooldownViolationType;
import com.backend.lumotus.dto.response.CooldownSettingsResponse;
import com.backend.lumotus.entity.QuizAttempt;
import com.backend.lumotus.entity.QuizCooldownSettings;
import com.backend.lumotus.exception.BadRequestException;
import com.backend.lumotus.exception.ResourceNotFoundException;
import com.backend.lumotus.repository.QuizAttemptRepository;
import com.backend.lumotus.repository.QuizCooldownSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizCooldownService {

    private static final UUID SETTINGS_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final ZoneId VN_ZONE = AppProperties.APP_ZONE;

    private final QuizCooldownSettingsRepository cooldownRepository;
    private final QuizAttemptRepository attemptRepository;

    // ============================================================
    // COOLDOWN CHECK — called before starting a quiz
    // ============================================================

    /**
     * Check if a user can start a quiz based on cooldown rules.
     * Returns a result with allowed=true if OK, or violation details if blocked.
     */
    @Transactional(readOnly = true)
    public CooldownCheckResult checkCooldown(UUID userId, UUID quizId) {
        QuizCooldownSettings settings = loadSettings();

        // If cooldown is globally disabled, allow
        if (!Boolean.TRUE.equals(settings.getEnabled())) {
            return CooldownCheckResult.allowed(quizId);
        }

        Instant now = Instant.now();

        // Check bypass for user
        if (isBypassed(settings.getBypassUserId(), settings.getBypassExpiresAt())) {
            if (settings.getBypassUserId().equals(userId)) {
                log.debug("Cooldown bypassed for user {}", userId);
                return CooldownCheckResult.allowed(quizId);
            }
        }

        // Check bypass for quiz
        if (isBypassed(settings.getBypassQuizId(), settings.getBypassExpiresAt())) {
            if (settings.getBypassQuizId().equals(quizId)) {
                log.debug("Cooldown bypassed for quiz {}", quizId);
                return CooldownCheckResult.allowed(quizId);
            }
        }

        // 1. Check minimum time between attempts (cooldown period)
        List<QuizAttempt> lastAttempts = attemptRepository.findLastCompletedAttempt(userId, quizId);
        long secondsSinceLast = lastAttempts.isEmpty() ? 999999L :
                ChronoUnit.SECONDS.between(lastAttempts.get(0).getFinishedAt(), now);

        if (secondsSinceLast < settings.getMinSecondsBetweenAttempts()) {
            int remaining = (int) (settings.getMinSecondsBetweenAttempts() - secondsSinceLast);
            Instant cooldownEnds = now.plusSeconds(remaining);
            return CooldownCheckResult.violation(
                    quizId,
                    CooldownViolationType.COOLDOWN_PERIOD,
                    String.format("Bạn vừa làm quiz này. Vui lòng chờ thêm %d giây trước khi thử lại.", remaining),
                    cooldownEnds,
                    remaining,
                    null,
                    null
            );
        }

        // 2. Check max attempts per quiz per day
        Instant startOfDay = LocalDate.now(VN_ZONE)
                .atStartOfDay(VN_ZONE)
                .toInstant();
        long dailyQuizAttempts = attemptRepository.countAttemptsSince(userId, quizId, startOfDay);

        if (dailyQuizAttempts >= settings.getMaxAttemptsPerQuizPerDay()) {
            Instant nextAllowed = startOfDay.plus(1, ChronoUnit.DAYS);
            int remaining = (int) ChronoUnit.SECONDS.between(now, nextAllowed);
            return CooldownCheckResult.violation(
                    quizId,
                    CooldownViolationType.DAILY_QUIZ_LIMIT,
                    String.format("Bạn đã đạt giới hạn %d lượt làm quiz này trong ngày. Giới hạn reset lúc 00:00 (GMT+7).",
                            settings.getMaxAttemptsPerQuizPerDay()),
                    nextAllowed,
                    remaining,
                    (int) dailyQuizAttempts,
                    settings.getMaxAttemptsPerQuizPerDay()
            );
        }

        // 3. Check max total attempts per day (all quizzes)
        long dailyTotal = attemptRepository.countTotalAttemptsSince(userId, startOfDay);
        if (dailyTotal >= settings.getMaxTotalAttemptsPerDay()) {
            Instant nextAllowed = startOfDay.plus(1, ChronoUnit.DAYS);
            int remaining = (int) ChronoUnit.SECONDS.between(now, nextAllowed);
            return CooldownCheckResult.violation(
                    quizId,
                    CooldownViolationType.DAILY_TOTAL_LIMIT,
                    String.format("Bạn đã đạt giới hạn %d lượt làm quiz trong ngày. Giới hạn reset lúc 00:00 (GMT+7).",
                            settings.getMaxTotalAttemptsPerDay()),
                    nextAllowed,
                    remaining,
                    (int) dailyTotal,
                    settings.getMaxTotalAttemptsPerDay()
            );
        }

        // 4. Check max total attempts per week (all quizzes)
        Instant startOfWeek = LocalDate.now(VN_ZONE)
                .with(java.time.DayOfWeek.MONDAY)
                .atStartOfDay(VN_ZONE)
                .toInstant();
        long weeklyTotal = attemptRepository.countTotalAttemptsSince(userId, startOfWeek);
        if (weeklyTotal >= settings.getMaxTotalAttemptsPerWeek()) {
            Instant nextMonday = LocalDate.now(VN_ZONE)
                    .with(java.time.DayOfWeek.MONDAY)
                    .plusWeeks(1)
                    .atStartOfDay(VN_ZONE)
                    .toInstant();
            int remaining = (int) ChronoUnit.SECONDS.between(now, nextMonday);
            return CooldownCheckResult.violation(
                    quizId,
                    CooldownViolationType.WEEKLY_TOTAL_LIMIT,
                    String.format("Bạn đã đạt giới hạn %d lượt làm quiz trong tuần. Giới hạn reset vào thứ 2 (GMT+7).",
                            settings.getMaxTotalAttemptsPerWeek()),
                    nextMonday,
                    remaining,
                    (int) weeklyTotal,
                    settings.getMaxTotalAttemptsPerWeek()
            );
        }

        return CooldownCheckResult.allowed(quizId);
    }

    // ============================================================
    // ADMIN: GET / UPDATE SETTINGS
    // ============================================================

    @Transactional(readOnly = true)
    public CooldownSettingsResponse getSettings() {
        return cooldownRepository.findSingleton()
                .map(CooldownSettingsResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Cooldown settings not found"));
    }

    @Transactional
    public CooldownSettingsResponse updateSettings(UpdateCooldownSettingsRequest request) {
        QuizCooldownSettings settings = cooldownRepository.findSingleton()
                .orElseThrow(() -> new ResourceNotFoundException("Cooldown settings not found"));

        if (request.enabled() != null) settings.setEnabled(request.enabled());
        if (request.minSecondsBetweenAttempts() != null) {
            settings.setMinSecondsBetweenAttempts(request.minSecondsBetweenAttempts());
        }
        if (request.maxAttemptsPerQuizPerDay() != null) {
            settings.setMaxAttemptsPerQuizPerDay(request.maxAttemptsPerQuizPerDay());
        }
        if (request.maxTotalAttemptsPerDay() != null) {
            settings.setMaxTotalAttemptsPerDay(request.maxTotalAttemptsPerDay());
        }
        if (request.maxTotalAttemptsPerWeek() != null) {
            settings.setMaxTotalAttemptsPerWeek(request.maxTotalAttemptsPerWeek());
        }

        settings = cooldownRepository.save(settings);
        log.info("Cooldown settings updated: enabled={}, minSeconds={}, maxQuizDaily={}, maxTotalDaily={}, maxTotalWeekly={}",
                settings.getEnabled(),
                settings.getMinSecondsBetweenAttempts(),
                settings.getMaxAttemptsPerQuizPerDay(),
                settings.getMaxTotalAttemptsPerDay(),
                settings.getMaxTotalAttemptsPerWeek());

        return CooldownSettingsResponse.from(settings);
    }

    @Transactional
    public CooldownSettingsResponse bypassCooldown(BypassCooldownRequest request) {
        QuizCooldownSettings settings = cooldownRepository.findSingleton()
                .orElseThrow(() -> new ResourceNotFoundException("Cooldown settings not found"));

        settings.setBypassUserId(request.userId());
        settings.setBypassQuizId(request.quizId());
        settings.setBypassExpiresAt(request.expiresAt());
        settings.setBypassReason(request.reason());

        settings = cooldownRepository.save(settings);
        log.info("Cooldown bypass set for user={}, quiz={}, expires={}, reason={}",
                request.userId(), request.quizId(), request.expiresAt(), request.reason());

        return CooldownSettingsResponse.from(settings);
    }

    @Transactional
    public CooldownSettingsResponse clearBypass() {
        QuizCooldownSettings settings = cooldownRepository.findSingleton()
                .orElseThrow(() -> new ResourceNotFoundException("Cooldown settings not found"));

        settings.setBypassUserId(null);
        settings.setBypassQuizId(null);
        settings.setBypassExpiresAt(null);
        settings.setBypassReason(null);

        settings = cooldownRepository.save(settings);
        log.info("Cooldown bypass cleared");

        return CooldownSettingsResponse.from(settings);
    }

    @Transactional(readOnly = true)
    public CooldownCheckResult getCooldownStatus(UUID userId, UUID quizId) {
        return checkCooldown(userId, quizId);
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private QuizCooldownSettings loadSettings() {
        return cooldownRepository.findSingleton()
                .orElseThrow(() -> new ResourceNotFoundException("Cooldown settings not initialized"));
    }

    private boolean isBypassed(UUID bypassId, Instant expiresAt) {
        if (bypassId == null) return false;
        if (expiresAt == null) return true;  // Permanent bypass
        return expiresAt.isAfter(Instant.now());
    }
}
