package com.backend.lumotus.entity;

import com.backend.lumotus.entity.common.SoftDeleteEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cards")
@Getter
@Setter
@NoArgsConstructor
public class Card extends SoftDeleteEntity {

    @Column(name = "deck_id", nullable = false)
    private UUID deckId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String front;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String back;

    @Column(length = 200)
    private String phonetic;

    @Column(name = "part_of_speech", length = 50)
    private String partOfSpeech;

    @Column(columnDefinition = "TEXT")
    private String hint;

    @Column(columnDefinition = "TEXT")
    private String example;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(length = 100)
    private String icon;

    @Column(name = "audio_url")
    private String audioUrl;

    @Column(length = 20)
    private String difficulty;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
