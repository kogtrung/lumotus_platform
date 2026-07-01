package com.backend.lumotus.entity;

import com.backend.lumotus.entity.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.hibernate.proxy.HibernateProxy;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "async_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AsyncJob extends BaseEntity {

    public enum JobType {
        AI_GENERATE,
        FILE_IMPORT
    }

    public enum JobStatus {
        PENDING,
        PROCESSING,
        DONE,
        FAILED
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private JobType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private JobStatus status = JobStatus.PENDING;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> result;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public boolean isTerminal() {
        return status == JobStatus.DONE || status == JobStatus.FAILED;
    }

    public boolean isPending() {
        return status == JobStatus.PENDING;
    }

    public boolean isProcessing() {
        return status == JobStatus.PROCESSING;
    }
}
