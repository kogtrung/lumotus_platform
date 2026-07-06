package com.backend.lumotus.entity;

public enum ReviewRating {
    AGAIN(0),
    HARD(1),
    GOOD(2),
    EASY(3);

    private final int quality;

    ReviewRating(int quality) {
        this.quality = quality;
    }

    public int quality() {
        return quality;
    }

    public static ReviewRating fromQuality(int quality) {
        for (ReviewRating rating : values()) {
            if (rating.quality == quality) {
                return rating;
            }
        }
        throw new IllegalArgumentException("Unknown review rating quality: " + quality);
    }
}
