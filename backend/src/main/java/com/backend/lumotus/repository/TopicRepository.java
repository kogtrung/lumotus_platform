package com.backend.lumotus.repository;

import com.backend.lumotus.entity.Topic;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicRepository extends JpaRepository<Topic, UUID> {

    List<Topic> findAllByOrderBySortOrderAscNameAsc();

    Optional<Topic> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
