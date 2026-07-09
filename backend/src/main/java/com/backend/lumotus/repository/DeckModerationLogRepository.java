package com.backend.lumotus.repository;

import com.backend.lumotus.entity.DeckModerationLog;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeckModerationLogRepository extends JpaRepository<DeckModerationLog, UUID> {

    List<DeckModerationLog> findByDeckIdOrderByCreatedAtDesc(UUID deckId);

    @Modifying
    @Query(value = "DELETE FROM deck_moderation_logs WHERE deck_id = :deckId", nativeQuery = true)
    void deleteAllByDeckId(@Param("deckId") UUID deckId);
}
