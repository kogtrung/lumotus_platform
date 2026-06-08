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
}
