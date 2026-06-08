package com.backend.lumotus.entity.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import java.time.Instant;
import lombok.Getter;

@Getter
@MappedSuperclass
public abstract class SoftDeleteEntity extends BaseEntity {

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public boolean isDeleted() {
        return deletedAt != null;
    }
}
