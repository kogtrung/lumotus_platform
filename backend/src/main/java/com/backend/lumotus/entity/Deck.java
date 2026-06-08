package com.backend.lumotus.entity;

import com.backend.lumotus.entity.common.SoftDeleteEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "decks")
@Getter
@Setter
@NoArgsConstructor
public class Deck extends SoftDeleteEntity {

    public enum OwnerType {
        USER,
        ADMIN
    }

    @Column(nullable = false, length = 120)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false, length = 20)
    private OwnerType ownerType = OwnerType.USER;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;

    @Column(name = "is_copyable", nullable = false)
    private boolean copyable = true;

    @Column(name = "language_front", nullable = false, length = 10)
    private String languageFront = "en";

    @Column(name = "language_back", nullable = false, length = 10)
    private String languageBack = "vi";

    @Column(name = "generated_by_ai", nullable = false)
    private boolean generatedByAi = false;

    @Column(name = "generation_prompt", columnDefinition = "TEXT")
    private String generationPrompt;

    @Column(name = "view_count", nullable = false)
    private int viewCount = 0;

    @Column(name = "copy_count", nullable = false)
    private int copyCount = 0;
}
