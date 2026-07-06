package com.backend.lumotus.util;

import java.text.Normalizer;
import java.util.UUID;
import java.util.regex.Pattern;

public final class SlugUtils {

    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$");

    private static final Pattern SLUG_PATTERN =
            Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");

    // Thay thế trực tiếp các ký tự tiếng Việt có dấu → không dấu
    // NFD không xử lý đúng hết tiếng Việt nên cần map thủ công
    private static final String[] VIETNAMESE_REPLACEMENTS = {
        "ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẴẲ", "A",
        "àáạảãâầấậẩẫăằắặẵẳ", "a",
        "ÈÉẸẺẼÊỀẾỆỂỄ", "E",
        "èéẹẻẽêềếệểễ", "e",
        "ÌÍỊỈĨ", "I",
        "ìíịỉĩ", "i",
        "ÒÓỌỎÕÔỒỐỘỔỖƠỜỢỞỠ", "O",
        "òóọỏõôồốộổỗơờợởỡ", "o",
        "ÙÚỤỦŨƯỪỰỬỮ", "U",
        "ùúụủũưừựửữ", "u",
        "ỲÝỴỶỸ", "Y",
        "ỳýịỷỹ", "y",
        "Đ", "D",
        "đ", "d"
    };

    private static String removeVietnameseDiacritics(String input) {
        String result = input;
        for (int i = 0; i < VIETNAMESE_REPLACEMENTS.length; i += 2) {
            String accented = VIETNAMESE_REPLACEMENTS[i];
            String plain = VIETNAMESE_REPLACEMENTS[i + 1];
            for (char c : accented.toCharArray()) {
                result = result.replace(c, plain.charAt(0));
            }
        }
        return result;
    }

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
        // Bước 1: bỏ dấu tiếng Việt bằng map thủ công (NFD không xử lý đúng)
        String normalized = removeVietnameseDiacritics(title.trim());
        // Bước 2: chuẩn hóa Unicode NFD để loại bỏ các combining marks còn lại
        normalized = Normalizer.normalize(normalized, Normalizer.Form.NFD)
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
