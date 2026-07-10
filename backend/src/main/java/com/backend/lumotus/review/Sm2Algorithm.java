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

        float newEase = easeFactor + (float) (properties.ease().a() - (3 - q) * (properties.ease().b() + (3 - q) * properties.ease().c()));
        if (newEase < properties.minEase()) {
            newEase = properties.minEase();
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
                    newInterval = properties.intervals().second() + 1;
                } else {
                    int base = Math.max(intervalDays, properties.intervals().second());
                    newInterval = (int) Math.ceil(base * newEase * 1.3);
                }
            } else {
                if (newReps == 1) {
                    newInterval = properties.intervals().first();
                } else if (newReps == 2) {
                    // Prevent interval regression if previously rated EASY
                    newInterval = Math.max(intervalDays, properties.intervals().second());
                } else if (newReps == 3) {
                    newInterval = Math.max(intervalDays, properties.intervals().third());
                } else {
                    newInterval = (int) Math.ceil(intervalDays * newEase);
                }
            }
        }

        Instant nextReviewAt = newInterval == 0 ? now : now.plus(newInterval, ChronoUnit.DAYS);
        return new Result(newEase, newReps, newInterval, nextReviewAt);
    }
}
