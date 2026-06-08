package com.backend.lumotus.entity;

import com.backend.lumotus.entity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseEntity {

    public enum Role {
        USER,
        ADMIN
    }

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    @Column(nullable = false)
    private int xp = 0;

    @Column(nullable = false)
    private int streak = 0;

    @Column(name = "last_study_date")
    private LocalDate lastStudyDate;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
