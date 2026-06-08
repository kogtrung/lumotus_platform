package com.backend.lumotus.repository;

import com.backend.lumotus.entity.Card;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CardRepository extends JpaRepository<Card, UUID> {

    Page<Card> findByDeckIdOrderBySortOrderAsc(UUID deckId, Pageable pageable);

    List<Card> findByDeckIdOrderBySortOrderAsc(UUID deckId);

    Optional<Card> findByIdAndDeckId(UUID id, UUID deckId);

    @Query("SELECT COUNT(c) FROM Card c WHERE c.deckId = :deckId")
    long countByDeckId(@Param("deckId") UUID deckId);

    @Query("SELECT COALESCE(MAX(c.sortOrder), -1) FROM Card c WHERE c.deckId = :deckId")
    int findMaxSortOrder(@Param("deckId") UUID deckId);
}
