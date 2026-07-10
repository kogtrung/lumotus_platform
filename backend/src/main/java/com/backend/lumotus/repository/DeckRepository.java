package com.backend.lumotus.repository;

import com.backend.lumotus.entity.Deck;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeckRepository extends JpaRepository<Deck, UUID> {

    @org.springframework.data.jpa.repository.Query(
            value = "SELECT * FROM decks WHERE id = :id", nativeQuery = true)
    Optional<Deck> findByIdIncludingDeleted(@Param("id") UUID id);

    @org.springframework.data.jpa.repository.Query(
            value = "SELECT * FROM decks WHERE slug = :slug", nativeQuery = true)
    List<Deck> findBySlugIncludingDeleted(@Param("slug") String slug);

    @Modifying
    @org.springframework.data.jpa.repository.Query(
            value = "DELETE FROM decks WHERE id = :deckId", nativeQuery = true)
    void deleteDeckHard(@Param("deckId") UUID deckId);

    @Query(
            """
            SELECT d FROM Deck d
            WHERE d.isPublic = true
            AND (:topicId IS NULL OR EXISTS (
                SELECT 1 FROM DeckTopic dt
                WHERE dt.id.deckId = d.id AND dt.id.topicId = :topicId
            ))
            AND (
                :q IS NULL OR :q = ''
                OR LOWER(d.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(d.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY d.viewCount DESC, d.createdAt DESC
            """)
    Page<Deck> findPublicDecks(
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

    @Query(
            """
            SELECT d FROM Deck d
            WHERE d.id = :id
            AND (d.ownerId = :userId OR d.isPublic = true)
            """)
    Optional<Deck> findAccessibleById(@Param("id") UUID id, @Param("userId") UUID userId);

    boolean existsByOwnerIdAndSlug(UUID ownerId, String slug);

    boolean existsBySlug(String slug);

    List<Deck> findBySlug(String slug);

    @Query(
            """
            SELECT d FROM Deck d
            WHERE d.slug = :slug
            AND (d.ownerId = :userId OR d.isPublic = true)
            """)
    List<Deck> findAccessibleBySlug(@Param("userId") UUID userId, @Param("slug") String slug);

    @Query(
            """
            SELECT d FROM Deck d
            WHERE d.deletedAt IS NULL
            AND d.isPublic = true
            AND (d.sourceType = 'OFFICIAL' OR d.verificationStatus = 'APPROVED')
            AND (
                :q IS NULL OR :q = ''
                OR LOWER(d.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(d.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY d.viewCount DESC, d.createdAt DESC
            """)
    Page<Deck> findExploreDecks(@Param("q") String q, Pageable pageable);

    @Query(
            """
            SELECT d FROM Deck d
            WHERE d.ownerId = :userId
            AND d.verificationStatus = 'PENDING'
            """)
    List<Deck> findPendingApprovalByOwner(@Param("userId") UUID userId);

    @Query(
            """
            SELECT d FROM Deck d
            WHERE d.verificationStatus = 'PENDING'
            AND (
                :q IS NULL OR :q = ''
                OR LOWER(d.title) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY d.createdAt DESC
            """)
    Page<Deck> findPendingApproval(@Param("q") String q, Pageable pageable);

    @Query(
            """
            SELECT d FROM Deck d
            WHERE (
                (d.sourceType = 'OFFICIAL' AND d.isPublic = false)
                OR d.isPublic = true
            )
            AND (:topicId IS NULL OR EXISTS (
                SELECT 1 FROM DeckTopic dt WHERE dt.id.deckId = d.id AND dt.id.topicId = :topicId
            ))
            AND (
                :q IS NULL OR :q = ''
                OR LOWER(d.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(d.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY d.createdAt DESC
            """)
    Page<Deck> findAdminAllDecks(@Param("topicId") UUID topicId, @Param("q") String q, Pageable pageable);

    @Query(
            """
            SELECT d FROM Deck d
            WHERE d.sourceType = 'OFFICIAL'
            AND d.isPublic = false
            AND (:topicId IS NULL OR EXISTS (
                SELECT 1 FROM DeckTopic dt WHERE dt.id.deckId = d.id AND dt.id.topicId = :topicId
            ))
            AND (
                :q IS NULL OR :q = ''
                OR LOWER(d.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(d.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY d.createdAt DESC
            """)
    Page<Deck> findAdminPrivateOfficialDecks(@Param("topicId") UUID topicId, @Param("q") String q, Pageable pageable);

    @Query(
            """
            SELECT d FROM Deck d
            WHERE d.isPublic = true
            AND (d.sourceType = 'OFFICIAL' OR d.verificationStatus = 'APPROVED')
            AND (:topicId IS NULL OR EXISTS (
                SELECT 1 FROM DeckTopic dt WHERE dt.id.deckId = d.id AND dt.id.topicId = :topicId
            ))
            AND (
                :q IS NULL OR :q = ''
                OR LOWER(d.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(d.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY d.createdAt DESC
            """)
    Page<Deck> findAdminPublicDecks(@Param("topicId") UUID topicId, @Param("q") String q, Pageable pageable);

    @Query(
            """
            SELECT d FROM Deck d
            WHERE d.sourceType IN ('COMMUNITY', 'PERSONAL')
            AND (:topicId IS NULL OR EXISTS (
                SELECT 1 FROM DeckTopic dt WHERE dt.id.deckId = d.id AND dt.id.topicId = :topicId
            ))
            AND (:verificationStatus IS NULL OR d.verificationStatus = :verificationStatus)
            AND (
                :q IS NULL OR :q = ''
                OR LOWER(d.title) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(COALESCE(d.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            ORDER BY d.createdAt DESC
            """)
    Page<Deck> findAdminUserDecksByStatus(
            @Param("topicId") UUID topicId,
            @Param("verificationStatus") String verificationStatus,
            @Param("q") String q,
            Pageable pageable);

    @org.springframework.data.jpa.repository.Query(
        "SELECT CAST(d.createdAt AS date), COUNT(d) " +
        "FROM Deck d " +
        "WHERE d.createdAt >= :start AND d.createdAt <= :end " +
        "GROUP BY CAST(d.createdAt AS date) " +
        "ORDER BY CAST(d.createdAt AS date) ASC"
    )
    java.util.List<Object[]> countNewDecksByDay(
            @org.springframework.data.repository.query.Param("start") java.time.Instant start,
            @org.springframework.data.repository.query.Param("end") java.time.Instant end);

    long countByOwnerId(UUID ownerId);
}
