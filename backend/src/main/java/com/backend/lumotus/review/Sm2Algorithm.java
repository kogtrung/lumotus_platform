package com.backend.lumotus.review;

import com.backend.lumotus.entity.ReviewRating;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

public final class Sm2Algorithm {

    private static final float MIN_EASE = 1.3f;

    private Sm2Algorithm() {}

    public record Result(float easeFactor, int repetitions, int intervalDays, Instant nextReviewAt) {}

    public static Result apply(
            float easeFactor, int repetitions, int intervalDays, ReviewRating rating, Instant now) {
        int q = rating.quality();

        float newEase = easeFactor + (0.15f - (3 - q) * (0.08f + (3 - q) * 0.02f));
        if (newEase < MIN_EASE) {
            newEase = MIN_EASE;
        }

        int newReps;
        int newInterval;

        if (q == 0) {
            newReps = 0;
            newInterval = 0;
        } else {
            newReps = repetitions + 1;
            if (newReps == 1) {
                newInterval = 1;
            } else if (newReps == 2) {
                newInterval = 3;
            } else if (newReps == 3) {
                newInterval = 6;
            } else {
                newInterval = (int) Math.ceil(intervalDays * newEase);
            }
        }

        Instant nextReviewAt = newInterval == 0 ? now : now.plus(newInterval, ChronoUnit.DAYS);
        return new Result(newEase, newReps, newInterval, nextReviewAt);
    }
}
