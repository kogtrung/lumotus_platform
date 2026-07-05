package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.UpdateDeckTagsRequest;
import com.backend.lumotus.dto.response.DeckTagsResponse;
import com.backend.lumotus.entity.DeckTag;
import com.backend.lumotus.exception.ResourceNotFoundException;
import com.backend.lumotus.repository.DeckRepository;
import com.backend.lumotus.repository.DeckTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeckTagService {

    private final DeckTagRepository deckTagRepository;
    private final DeckRepository deckRepository;

    @Transactional(readOnly = true)
    public DeckTagsResponse getTags(UUID deckId, UUID userId) {
        if (!deckRepository.existsById(deckId)) {
            throw new ResourceNotFoundException("Deck not found");
        }
        List<DeckTag> tags = deckTagRepository.findByDeckIdAndUserId(deckId, userId);
        List<String> tagNames = tags.stream()
                .map(DeckTag::getTagName)
                .toList();
        return DeckTagsResponse.of(tagNames);
    }

    @Transactional
    public DeckTagsResponse updateTags(UUID deckId, UUID userId, UpdateDeckTagsRequest request) {
        if (!deckRepository.existsById(deckId)) {
            throw new ResourceNotFoundException("Deck not found");
        }

        // Delete existing tags for this deck+user
        deckTagRepository.deleteAllByDeckIdAndUserId(deckId, userId);

        // Insert new tags
        List<DeckTag> newTags = request.tags().stream()
                .filter(t -> t != null && !t.isBlank())
                .map(tagName -> DeckTag.builder()
                        .deckId(deckId)
                        .userId(userId)
                        .tagName(tagName.toLowerCase().trim())
                        .build())
                .toList();

        if (!newTags.isEmpty()) {
            deckTagRepository.saveAll(newTags);
        }

        return DeckTagsResponse.of(newTags.stream().map(DeckTag::getTagName).toList());
    }

    @Transactional
    public void deleteTag(UUID deckId, UUID userId, String tagName) {
        if (!deckRepository.existsById(deckId)) {
            throw new ResourceNotFoundException("Deck not found");
        }
        deckTagRepository.deleteByDeckIdAndUserIdAndTagName(deckId, userId, tagName.toLowerCase().trim());
    }
}
