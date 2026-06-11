package com.backend.lumotus.repository;

import com.backend.lumotus.entity.UserDeckProgress;
import com.backend.lumotus.entity.UserDeckProgressId;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserDeckProgressRepository extends JpaRepository<UserDeckProgress, UserDeckProgressId> {

    boolean existsByIdUserIdAndIdDeckId(UUID userId, UUID deckId);
}
