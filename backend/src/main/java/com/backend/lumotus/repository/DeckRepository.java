package com.backend.lumotus.repository;

import com.backend.lumotus.entity.Deck;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeckRepository extends JpaRepository<Deck, UUID> {

    @Query(
            """
            SELECT d FROM Deck d
            WHERE (d.isPublic = true OR d.ownerId = :userId)
            AND (:topicId IS NULL OR EXISTS (
                SELECT 1 FROM DeckTopic dt
                WHERE dt.id.deckId = d.id AND dt.id.topicId = :topicId
            ))
            AND (
                :q IS NULL OR :q = ''
                OR LOWER(d.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(d.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY d.createdAt DESC
            """)
    Page<Deck> findVisible(
            @Param("userId") UUID userId,
            @Param("topicId") UUID topicId,
            @Param("q") String q,
            Pageable pageable);

    @Query(
            """
            SELECT d FROM Deck d
            WHERE d.ownerId = :userId
            AND (
                :q IS NULL OR :q = ''
                OR LOWER(d.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(d.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY d.updatedAt DESC
            """)
    Page<Deck> findOwnedByUser(@Param("userId") UUID userId, @Param("q") String q, Pageable pageable);

    Optional<Deck> findByIdAndOwnerId(UUID id, UUID ownerId);

    Optional<Deck> findByOwnerIdAndSlug(UUID ownerId, String slug);

    boolean existsByOwnerIdAndSlug(UUID ownerId, String slug);

    @Query(
            """
            SELECT d FROM Deck d
            WHERE d.slug = :slug
            AND (d.ownerId = :userId OR d.isPublic = true)
            """)
    List<Deck> findAccessibleBySlug(@Param("userId") UUID userId, @Param("slug") String slug);
}
