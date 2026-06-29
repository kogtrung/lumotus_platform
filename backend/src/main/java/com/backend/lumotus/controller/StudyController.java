package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.StartStudyRequest;
import com.backend.lumotus.dto.request.SubmitStudyRequest;
import com.backend.lumotus.dto.response.StartStudyResponse;
import com.backend.lumotus.dto.response.StudyResultResponse;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.service.StudyService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/study")
@RequiredArgsConstructor
public class StudyController {

    private final StudyService studyService;

    @PostMapping("/{deckRef}/start")
    public ResponseEntity<StartStudyResponse> startStudy(
            @PathVariable String deckRef,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StartStudyRequest request) {
        return ResponseEntity.ok(studyService.startStudy(principal, deckRef, request));
    }

    @PostMapping("/{attemptId}/submit")
    public ResponseEntity<StudyResultResponse> submitStudy(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubmitStudyRequest request) {
        return ResponseEntity.ok(studyService.submitStudy(attemptId, request, principal));
    }

    @GetMapping("/{attemptId}/result")
    public ResponseEntity<StudyResultResponse> getResult(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(studyService.getResult(attemptId, principal));
    }
}
