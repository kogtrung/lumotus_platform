package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.UpdateDeckTagsRequest;
import com.backend.lumotus.dto.response.DeckTagsResponse;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.service.DeckTagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/decks/{deckId}/tags")
@RequiredArgsConstructor
public class DeckTagController {

    private final DeckTagService deckTagService;

    @GetMapping
    public ResponseEntity<DeckTagsResponse> getTags(
            @PathVariable UUID deckId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(deckTagService.getTags(deckId, principal.getId()));
    }

    @PutMapping
    public ResponseEntity<DeckTagsResponse> updateTags(
            @PathVariable UUID deckId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateDeckTagsRequest request) {
        return ResponseEntity.ok(deckTagService.updateTags(deckId, principal.getId(), request));
    }

    @DeleteMapping("/{tagName}")
    public ResponseEntity<Void> deleteTag(
            @PathVariable UUID deckId,
            @PathVariable String tagName,
            @AuthenticationPrincipal UserPrincipal principal) {
        deckTagService.deleteTag(deckId, principal.getId(), tagName);
        return ResponseEntity.noContent().build();
    }
}
