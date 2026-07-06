package com.backend.lumotus.dto.response;

import java.time.LocalDate;
import java.util.List;

/**
 * User's progress data: XP, streak, heatmap, rank.
 */
public record ProgressResponse(
        int xp,
        int streak,
        LocalDate lastStudyDate,
        List<ActivityDayResponse> heatmap,
        Integer rank,
        long totalParticipants
) {}
