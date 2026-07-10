package com.backend.lumotus.review;

import com.backend.lumotus.config.Sm2Properties;
import com.backend.lumotus.entity.ReviewRating;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

public final class Sm2Algorithm {

    private Sm2Algorithm() {}

    public record Result(float easeFactor, int repetitions, int intervalDays, Instant nextReviewAt) {
    }

    public static Result apply(
            float easeFactor,
            int repetitions,
            int intervalDays,
            ReviewRating rating,
            Instant now,
            Sm2Properties properties) {
        int q = rating.quality();

        float easeA = properties != null && properties.ease() != null ? properties.ease().a() : 0.15f;
        float easeB = properties != null && properties.ease() != null ? properties.ease().b() : 0.08f;
        float easeC = properties != null && properties.ease() != null ? properties.ease().c() : 0.02f;
        float minEase = properties != null ? properties.minEase() : 1.3f;

        int intFirst = properties != null && properties.intervals() != null ? properties.intervals().first() : 1;
        int intSecond = properties != null && properties.intervals() != null ? properties.intervals().second() : 3;
        int intThird = properties != null && properties.intervals() != null ? properties.intervals().third() : 6;

        float newEase = easeFactor + (float) (easeA - (3 - q) * (easeB + (3 - q) * easeC));
        if (newEase < minEase) {
            newEase = minEase;
        }

        int newReps;
        int newInterval;

        if (q == 0) {
            newReps = 0;
            newInterval = 0;
        } else {
            newReps = repetitions + 1;
            
            if (q == 3) {
                // EASY rating accelerates intervals significantly
                if (repetitions == 0) {
                    newInterval = intSecond + 1;
                } else {
                    int base = Math.max(intervalDays, intSecond);
                    newInterval = (int) Math.ceil(base * newEase * 1.3);
                }
            } else {
                if (newReps == 1) {
                    newInterval = intFirst;
                } else if (newReps == 2) {
                    // Prevent interval regression if previously rated EASY
                    newInterval = Math.max(intervalDays, intSecond);
                } else if (newReps == 3) {
                    newInterval = Math.max(intervalDays, intThird);
                } else {
                    newInterval = (int) Math.ceil(intervalDays * newEase);
                }
            }
        }

        Instant nextReviewAt = newInterval == 0 ? now : now.plus(newInterval, ChronoUnit.DAYS);
        return new Result(newEase, newReps, newInterval, nextReviewAt);
    }
}
