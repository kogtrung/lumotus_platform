package com.backend.lumotus.repository;

import com.backend.lumotus.entity.User;
import com.backend.lumotus.entity.User.OauthProvider;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByOauthProviderAndOauthSubject(OauthProvider oauthProvider, String oauthSubject);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    @org.springframework.data.jpa.repository.Query(
        "SELECT CAST(u.createdAt AS date), COUNT(u) " +
        "FROM User u " +
        "WHERE u.createdAt >= :start AND u.createdAt <= :end " +
        "GROUP BY CAST(u.createdAt AS date) " +
        "ORDER BY CAST(u.createdAt AS date) ASC"
    )
    java.util.List<Object[]> countNewUsersByDay(
            @org.springframework.data.repository.query.Param("start") java.time.Instant start,
            @org.springframework.data.repository.query.Param("end") java.time.Instant end
    );
}

