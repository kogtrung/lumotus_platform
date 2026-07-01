package com.backend.lumotus.entity;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class DeckTagId implements Serializable {
    private UUID deckId;
    private UUID userId;
    private String tagName;
}
