package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.GenerateDeckRequest;
import com.backend.lumotus.dto.response.AsyncJobResponse;
import com.backend.lumotus.entity.AsyncJob;
import com.backend.lumotus.entity.Card;
import com.backend.lumotus.entity.Deck;
import com.backend.lumotus.entity.UserCardReview;
import com.backend.lumotus.entity.UserCardReviewId;
import com.backend.lumotus.exception.BadRequestException;
import com.backend.lumotus.repository.*;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Async job processing service.
 * Handles AI deck generation and file import jobs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AsyncJobService {

    private final AsyncJobRepository jobRepository;
    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final UserCardReviewRepository reviewRepository;

    @Transactional
    public AsyncJobResponse createGenerationJob(UserPrincipal principal, GenerateDeckRequest request) {
        AsyncJob job = new AsyncJob();
        job.setType(AsyncJob.JobType.AI_GENERATE);
        job.setStatus(AsyncJob.JobStatus.PENDING);
        job.setUserId(principal.getId());
        job.setResult(Map.of(
                "topic", request.topic(),
                "description", request.description() != null ? request.description() : "",
                "cardCount", request.cardCount(),
                "language", request.language() != null ? request.language() : "en"
        ));

        job = jobRepository.save(job);
        log.info("Created AI generation job: {}", job.getId());

        // Trigger async processing
        processAiGenerationAsync(job.getId(), principal.getId(), request);

        return AsyncJobResponse.from(job);
    }

    @Async
    public void processAiGenerationAsync(UUID jobId, UUID userId, GenerateDeckRequest request) {
        try {
            processAiGeneration(jobId, userId, request);
        } catch (Exception e) {
            log.error("AI generation job failed: {}", jobId, e);
            failJob(jobId, e.getMessage());
        }
    }

    @Transactional
    public void processAiGeneration(UUID jobId, UUID userId, GenerateDeckRequest request) {
        AsyncJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) return;

        job.setStatus(AsyncJob.JobStatus.PROCESSING);
        jobRepository.save(job);

        // Generate deck title from topic
        String baseSlug = SlugUtils.slugify(request.topic());
        String title = request.topic();

        // Ensure unique slug
        String finalSlug = baseSlug;
        int counter = 1;
        while (deckRepository.existsByOwnerIdAndSlug(userId, finalSlug)) {
            finalSlug = baseSlug + "-" + counter++;
        }

        // Create deck
        Deck deck = new Deck();
        deck.setTitle(title);
        deck.setDescription(request.description());
        deck.setOwnerId(userId);
        deck.setSlug(finalSlug);
        deck.setPublic(true);
        deck.setGeneratedByAi(true);
        deck.setGenerationPrompt(request.topic());
        deck = deckRepository.save(deck);

        // Generate cards (simulated - in production, call AI API)
        List<Map<String, String>> generatedCards = generateCardsWithAi(request.topic(), request.cardCount(), request.language());

        int order = 0;
        for (Map<String, String> cardData : generatedCards) {
            Card card = new Card();
            card.setDeckId(deck.getId());
            card.setFront(cardData.get("front"));
            card.setBack(cardData.get("back"));
            card.setPhonetic(cardData.get("phonetic"));
            card.setExample(cardData.get("example"));
            card.setSortOrder(order++);
            card = cardRepository.save(card);

            // Create initial review record
            UserCardReview review = new UserCardReview();
            review.setId(new UserCardReviewId(userId, card.getId()));
            review.setDeckId(deck.getId());
            reviewRepository.save(review);
        }

        // Mark as done
        job.setStatus(AsyncJob.JobStatus.DONE);
        job.setResult(Map.of(
                "deckId", deck.getId().toString(),
                "deckSlug", deck.getSlug(),
                "title", deck.getTitle(),
                "cardCount", generatedCards.size()
        ));
        jobRepository.save(job);

        log.info("AI generation completed: jobId={}, deckId={}", jobId, deck.getId());
    }

    private List<Map<String, String>> generateCardsWithAi(String topic, int count, String language) {
        // TODO: In production, call OpenAI/Claude API here
        // For now, return sample cards
        List<Map<String, String>> cards = new ArrayList<>();

        String[] sampleFronts = {
                "Hello", "Goodbye", "Thank you", "Please", "Yes",
                "No", "Good morning", "Good night", "How are you?", "What's your name?"
        };

        String[] sampleBacks = {
                "Xin chào", "Tạm biệt", "Cảm ơn", "Làm ơn", "Có",
                "Không", "Chào buổi sáng", "Chúc ngủ ngon", "Bạn khỏe không?", "Tên bạn là gì?"
        };

        for (int i = 0; i < Math.min(count, sampleFronts.length); i++) {
            Map<String, String> card = new HashMap<>();
            card.put("front", sampleFronts[i]);
            card.put("back", sampleBacks[i]);
            card.put("phonetic", "/sample/");
            card.put("example", "Example: " + sampleFronts[i]);
            cards.add(card);
        }

        return cards;
    }

    @Transactional
    public void failJob(UUID jobId, String errorMessage) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(AsyncJob.JobStatus.FAILED);
            job.setErrorMessage(errorMessage);
            jobRepository.save(job);
        });
    }

    @Transactional(readOnly = true)
    public AsyncJobResponse getJob(UUID jobId, UUID userId) {
        AsyncJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new BadRequestException("Job not found"));

        if (!job.getUserId().equals(userId)) {
            throw new BadRequestException("Not authorized to view this job");
        }

        return AsyncJobResponse.from(job);
    }

    @Transactional(readOnly = true)
    public List<AsyncJobResponse> getUserJobs(UUID userId) {
        return jobRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(AsyncJobResponse::from)
                .toList();
    }

    /**
     * Polling endpoint: returns list of user's pending/processing jobs.
     */
    @Transactional(readOnly = true)
    public List<AsyncJobResponse> getActiveJobs(UUID userId) {
        return jobRepository.findActiveByUserId(userId)
                .stream()
                .map(AsyncJobResponse::from)
                .toList();
    }
}
