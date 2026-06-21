package com.backend.lumotus.media;

import com.backend.lumotus.exception.BadRequestException;

public enum MediaFolder {
    AVATARS("avatars"),
    CARDS("cards"),
    DECKS("decks"),
    AUDIO("audio");

    private final String path;

    MediaFolder(String path) {
        this.path = path;
    }

    public String path() {
        return path;
    }

    public static MediaFolder from(String value) {
        if (value == null || value.isBlank()) {
            return CARDS;
        }
        String normalized = value.trim().toLowerCase();
        for (MediaFolder folder : values()) {
            if (folder.path.equals(normalized) || folder.name().equalsIgnoreCase(normalized)) {
                return folder;
            }
        }
        throw new BadRequestException("Invalid folder — use avatars, cards, decks, or audio");
    }
}
