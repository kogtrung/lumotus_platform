package com.backend.lumotus.repository;

import com.backend.lumotus.entity.AsyncJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AsyncJobRepository extends JpaRepository<AsyncJob, UUID> {

    @Query("SELECT j FROM AsyncJob j WHERE j.userId = :userId ORDER BY j.createdAt DESC")
    List<AsyncJob> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT j FROM AsyncJob j WHERE j.userId = :userId AND j.status IN ('PENDING', 'PROCESSING') ORDER BY j.createdAt DESC")
    List<AsyncJob> findActiveByUserId(@Param("userId") UUID userId);

    @Query("SELECT j FROM AsyncJob j WHERE j.status = 'PENDING' ORDER BY j.createdAt ASC LIMIT :limit")
    List<AsyncJob> findPendingJobs(@Param("limit") int limit);

    @Modifying
    @Query("UPDATE AsyncJob j SET j.status = :status, j.updatedAt = :now WHERE j.id = :id")
    void updateStatus(@Param("id") UUID id, @Param("status") AsyncJob.JobStatus status, @Param("now") Instant now);
}
