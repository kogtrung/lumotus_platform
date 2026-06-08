package com.backend.lumotus.repository;

import com.backend.lumotus.entity.DeckTopic;
import com.backend.lumotus.entity.DeckTopicId;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeckTopicRepository extends JpaRepository<DeckTopic, DeckTopicId> {

    List<DeckTopic> findByIdDeckId(UUID deckId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM DeckTopic dt WHERE dt.id.deckId = :deckId")
    void deleteAllByDeckId(@Param("deckId") UUID deckId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM DeckTopic dt WHERE dt.id.topicId = :topicId")
    void deleteAllByTopicId(@Param("topicId") UUID topicId);
}
