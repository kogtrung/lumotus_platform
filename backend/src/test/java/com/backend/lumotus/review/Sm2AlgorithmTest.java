package com.backend.lumotus.review;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.backend.lumotus.entity.ReviewRating;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;

class Sm2AlgorithmTest {

    @Test
    void againResetsRepetitionsAndSchedulesSameDay() {
        Instant now = Instant.parse("2026-06-07T10:00:00Z");
        Sm2Algorithm.Result result = Sm2Algorithm.apply(2.5f, 3, 6, ReviewRating.AGAIN, now);

        assertEquals(0, result.repetitions());
        assertEquals(0, result.intervalDays());
        assertEquals(now, result.nextReviewAt());
    }

    @Test
    void goodFirstReviewSchedulesOneDay() {
        Instant now = Instant.parse("2026-06-07T10:00:00Z");
        Sm2Algorithm.Result result = Sm2Algorithm.apply(2.5f, 0, 0, ReviewRating.GOOD, now);

        assertEquals(1, result.repetitions());
        assertEquals(1, result.intervalDays());
        assertEquals(now.plus(1, ChronoUnit.DAYS), result.nextReviewAt());
    }

    @Test
    void easeFactorNeverBelowMinimum() {
        Instant now = Instant.now();
        Sm2Algorithm.Result result = Sm2Algorithm.apply(1.3f, 2, 3, ReviewRating.AGAIN, now);
        assertEquals(1.3f, result.easeFactor(), 0.001f);
    }
}
