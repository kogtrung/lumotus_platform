package com.backend.lumotus.util;

import java.text.Normalizer;
import java.util.UUID;
import java.util.regex.Pattern;

public final class SlugUtils {

    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$");

    private static final Pattern SLUG_PATTERN =
            Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");

    private SlugUtils() {}

    public static boolean isUuid(String value) {
        return value != null && UUID_PATTERN.matcher(value).matches();
    }

    public static UUID parseUuid(String value) {
        return UUID.fromString(value);
    }

    public static boolean isValidSlug(String slug) {
        return slug != null && SLUG_PATTERN.matcher(slug).matches();
    }

    /** Sinh slug kebab-case từ title (bỏ dấu tiếng Việt). */
    public static String slugify(String title) {
        if (title == null || title.isBlank()) {
            return "deck";
        }
        String normalized = Normalizer.normalize(title.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        String slug = normalized
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (slug.isBlank()) {
            return "deck";
        }
        return slug.length() > 100 ? slug.substring(0, 100).replaceAll("-+$", "") : slug;
    }
}
