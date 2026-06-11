package com.backend.lumotus.repository;

import com.backend.lumotus.entity.DailyActivity;
import com.backend.lumotus.entity.DailyActivityId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyActivityRepository extends JpaRepository<DailyActivity, DailyActivityId> {}
