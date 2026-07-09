package com.backend.lumotus.repository;

import com.backend.lumotus.entity.Card;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CardRepository extends JpaRepository<Card, UUID> {

    Page<Card> findByDeckIdOrderBySortOrderAsc(UUID deckId, Pageable pageable);

    @Query(
            """
            SELECT c FROM Card c
            WHERE c.deckId = :deckId
            AND (
                :q IS NULL OR :q = ''
                OR LOWER(c.front) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(c.back) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(c.phonetic, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY c.sortOrder ASC
            """)
    Page<Card> searchByDeckId(
            @Param("deckId") UUID deckId, @Param("q") String q, Pageable pageable);

    List<Card> findByDeckIdOrderBySortOrderAsc(UUID deckId);

    Optional<Card> findByIdAndDeckId(UUID id, UUID deckId);

    @Query("SELECT COUNT(c) FROM Card c WHERE c.deckId = :deckId")
    long countByDeckId(@Param("deckId") UUID deckId);

    @Query("SELECT COALESCE(MAX(c.sortOrder), -1) FROM Card c WHERE c.deckId = :deckId")
    int findMaxSortOrder(@Param("deckId") UUID deckId);

    @Query(
            """
            SELECT c FROM Card c
            WHERE c.deckId = :deckId
            AND NOT EXISTS (
                SELECT 1 FROM UserCardReview r
                WHERE r.id.userId = :userId AND r.id.cardId = c.id
            )
            ORDER BY c.sortOrder ASC
            """)
    List<Card> findNewCardsForUser(
            @Param("deckId") UUID deckId, @Param("userId") UUID userId, Pageable pageable);

    @Query(
            """
            SELECT c FROM Card c
            JOIN Deck d ON d.id = c.deckId
            WHERE d.ownerId = :userId
            AND NOT EXISTS (
                SELECT 1 FROM UserCardReview r
                WHERE r.id.userId = :userId AND r.id.cardId = c.id
            )
            ORDER BY c.sortOrder ASC
            """)
    List<Card> findNewCardsForUserAcrossDecks(@Param("userId") UUID userId, Pageable pageable);

    @Query(
            """
            SELECT COUNT(c) FROM Card c
            WHERE c.deckId = :deckId
            AND NOT EXISTS (
                SELECT 1 FROM UserCardReview r
                WHERE r.id.userId = :userId AND r.id.cardId = c.id
            )
            """)
    long countNewCardsForUser(@Param("deckId") UUID deckId, @Param("userId") UUID userId);

    @Query(
            """
            SELECT COUNT(c) FROM Card c
            JOIN Deck d ON d.id = c.deckId
            WHERE d.ownerId = :userId
            AND NOT EXISTS (
                SELECT 1 FROM UserCardReview r
                WHERE r.id.userId = :userId AND r.id.cardId = c.id
            )
            """)
    long countNewCardsForUserAcrossDecks(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM Card c WHERE c.deckId = :deckId")
    void deleteAllByDeckId(@Param("deckId") UUID deckId);
}
