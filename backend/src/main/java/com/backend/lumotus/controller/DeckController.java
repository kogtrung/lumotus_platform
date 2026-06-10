package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.CreateCardRequest;
import com.backend.lumotus.dto.request.CreateDeckRequest;
import com.backend.lumotus.dto.request.UpdateCardRequest;
import com.backend.lumotus.dto.request.UpdateDeckRequest;
import com.backend.lumotus.dto.response.CardResponse;
import com.backend.lumotus.dto.response.DeckSummaryResponse;
import com.backend.lumotus.dto.response.ImportDeckResponse;
import com.backend.lumotus.dto.response.PageResponse;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.service.DeckService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/decks")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;

    @GetMapping
    public ResponseEntity<PageResponse<DeckSummaryResponse>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID topicId,
            @RequestParam(required = false) String topicSlug,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean mine) {
        return ResponseEntity.ok(deckService.listDecks(principal, topicId, topicSlug, q, page, size, mine));
    }

    @PostMapping
    public ResponseEntity<DeckSummaryResponse> create(
            @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CreateDeckRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deckService.createDeck(request, principal));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportDeckResponse> importCsv(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String deckRef) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(deckService.importCsv(file, title, deckRef, principal));
    }

    @GetMapping("/{deckRef}")
    public ResponseEntity<DeckSummaryResponse> get(
            @PathVariable String deckRef, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(deckService.getDeck(deckRef, principal));
    }

    @PutMapping("/{deckRef}")
    public ResponseEntity<DeckSummaryResponse> update(
            @PathVariable String deckRef,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateDeckRequest request) {
        return ResponseEntity.ok(deckService.updateDeck(deckRef, request, principal));
    }

    @DeleteMapping("/{deckRef}")
    public ResponseEntity<Void> delete(
            @PathVariable String deckRef, @AuthenticationPrincipal UserPrincipal principal) {
        deckService.deleteDeck(deckRef, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{deckRef}/copy")
    public ResponseEntity<DeckSummaryResponse> copy(
            @PathVariable String deckRef, @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deckService.copyDeck(deckRef, principal));
    }

    @GetMapping("/{deckRef}/cards")
    public ResponseEntity<PageResponse<CardResponse>> listCards(
            @PathVariable String deckRef,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(deckService.listCards(deckRef, principal, page, size, q));
    }

    @PostMapping("/{deckRef}/cards")
    public ResponseEntity<CardResponse> addCard(
            @PathVariable String deckRef,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deckService.addCard(deckRef, request, principal));
    }

    @PutMapping("/{deckRef}/cards/{cardId}")
    public ResponseEntity<CardResponse> updateCard(
            @PathVariable String deckRef,
            @PathVariable UUID cardId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateCardRequest request) {
        return ResponseEntity.ok(deckService.updateCard(deckRef, cardId, request, principal));
    }

    @DeleteMapping("/{deckRef}/cards/{cardId}")
    public ResponseEntity<Void> deleteCard(
            @PathVariable String deckRef,
            @PathVariable UUID cardId,
            @AuthenticationPrincipal UserPrincipal principal) {
        deckService.deleteCard(deckRef, cardId, principal);
        return ResponseEntity.noContent().build();
    }
}
