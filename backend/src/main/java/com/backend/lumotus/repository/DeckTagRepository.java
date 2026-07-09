package com.backend.lumotus.repository;

import com.backend.lumotus.entity.DeckTag;
import com.backend.lumotus.entity.DeckTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeckTagRepository extends JpaRepository<DeckTag, DeckTagId> {

    List<DeckTag> findByDeckIdAndUserId(UUID deckId, UUID userId);

    List<DeckTag> findByUserId(UUID userId);

    boolean existsByDeckIdAndUserIdAndTagName(UUID deckId, UUID userId, String tagName);

    void deleteByDeckIdAndUserIdAndTagName(UUID deckId, UUID userId, String tagName);

    @Query("SELECT DISTINCT dt.tagName FROM DeckTag dt WHERE dt.userId = :userId ORDER BY dt.tagName")
    List<String> findDistinctTagsByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM DeckTag dt WHERE dt.deckId = :deckId AND dt.userId = :userId")
    void deleteAllByDeckIdAndUserId(@Param("deckId") UUID deckId, @Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM DeckTag dt WHERE dt.deckId = :deckId")
    void deleteAllByDeckId(@Param("deckId") UUID deckId);
}
