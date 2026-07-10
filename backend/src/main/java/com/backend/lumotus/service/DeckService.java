package com.backend.lumotus.service;

import com.backend.lumotus.dto.request.CreateCardRequest;
import com.backend.lumotus.dto.request.CreateDeckRequest;
import com.backend.lumotus.dto.request.SubmitDeckApprovalRequest;
import com.backend.lumotus.dto.request.UpdateCardRequest;
import com.backend.lumotus.dto.request.UpdateDeckRequest;
import com.backend.lumotus.dto.response.CardResponse;
import com.backend.lumotus.dto.response.DeckSummaryResponse;
import com.backend.lumotus.dto.response.ImportDeckResponse;
import com.backend.lumotus.dto.response.PageResponse;
import com.backend.lumotus.dto.response.TopicResponse;
import com.backend.lumotus.entity.DeckModerationLog;
import com.backend.lumotus.service.CsvDeckImporter.ImportRow;
import com.backend.lumotus.service.CsvDeckImporter.ParseResult;
import com.backend.lumotus.entity.Card;
import com.backend.lumotus.entity.Deck;
import com.backend.lumotus.entity.Quiz;
import com.backend.lumotus.entity.DeckTopic;
import com.backend.lumotus.entity.DeckTopicId;
import com.backend.lumotus.entity.Topic;
import com.backend.lumotus.exception.BadRequestException;
import com.backend.lumotus.exception.ConflictException;
import com.backend.lumotus.exception.ForbiddenException;
import com.backend.lumotus.exception.ResourceNotFoundException;
import com.backend.lumotus.util.SlugUtils;
import com.backend.lumotus.repository.CardRepository;
import com.backend.lumotus.repository.DeckModerationLogRepository;
import com.backend.lumotus.repository.DeckRepository;
import com.backend.lumotus.repository.DeckTopicRepository;
import com.backend.lumotus.repository.DeckTagRepository;
import com.backend.lumotus.repository.QuizRepository;
import com.backend.lumotus.repository.QuizAnswerRepository;
import com.backend.lumotus.repository.QuizQuestionRepository;
import com.backend.lumotus.repository.QuizAttemptRepository;
import com.backend.lumotus.repository.UserCardReviewRepository;
import com.backend.lumotus.repository.UserDeckProgressRepository;
import com.backend.lumotus.repository.TopicRepository;
import com.backend.lumotus.repository.UserRepository;
import com.backend.lumotus.security.UserPrincipal;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DeckService {

    private static final int DEFAULT_CARD_PAGE_SIZE = 50;

    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final DeckTopicRepository deckTopicRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final DeckModerationLogRepository deckModerationLogRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final UserCardReviewRepository userCardReviewRepository;
    private final UserDeckProgressRepository userDeckProgressRepository;
    private final DeckTagRepository deckTagRepository;

    @Transactional(readOnly = true)
    public PageResponse<DeckSummaryResponse> listDecks(
            UserPrincipal principal,
            UUID topicId,
            String topicSlug,
            String q,
            int page,
            int size,
            boolean mineOnly,
            Boolean isPublic,
            String verificationStatus) {
        Pageable pageable = PageRequest.of(page, size);
        boolean isAdmin = "ADMIN".equals(principal.getRole());

        // Admin tabs (via filterPublic + approvalStatus params)
        if (isAdmin) {
            // "Tất cả" — OFFICIAL (any public state) + all public decks
            if (isPublic == null && verificationStatus == null) {
                Page<Deck> decks = deckRepository.findAdminAllDecks(topicId, blankToNull(q), pageable);
                return PageResponse.from(decks.map(this::toSummary));
            }
            // "Riêng tư" — OFFICIAL decks not yet published
            if (Boolean.FALSE.equals(isPublic)) {
                Page<Deck> decks = deckRepository.findAdminPrivateOfficialDecks(topicId, blankToNull(q), pageable);
                return PageResponse.from(decks.map(this::toSummary));
            }
            // "Công khai" — decks visible on Explore
            if (Boolean.TRUE.equals(isPublic) && verificationStatus == null) {
                Page<Deck> decks = deckRepository.findAdminPublicDecks(topicId, blankToNull(q), pageable);
                return PageResponse.from(decks.map(this::toSummary));
            }
            // Status tabs — COMMUNITY decks filtered by verificationStatus
            Page<Deck> decks = deckRepository.findAdminUserDecksByStatus(topicId, verificationStatus, blankToNull(q), pageable);
            return PageResponse.from(decks.map(this::toSummary));
        }

        UUID resolvedTopicId = resolveTopicId(topicId, topicSlug);
        Page<Deck> decks = mineOnly
                ? deckRepository.findOwnedByUser(principal.getId(), blankToNull(q), pageable)
                : deckRepository.findPublicDecks(resolvedTopicId, blankToNull(q), pageable);
        return PageResponse.from(decks.map(this::toSummary));
    }

    @Transactional
    public DeckSummaryResponse getDeck(String deckRef, UserPrincipal principal) {
        Deck deck = resolveViewableDeck(deckRef, principal);
        deck.setViewCount(deck.getViewCount() + 1);
        deckRepository.save(deck);

        String latestNote = deck.getVerificationNote();
        if ("REJECTED".equals(deck.getVerificationStatus()) && latestNote == null) {
            latestNote = deckModerationLogRepository.findByDeckIdOrderByCreatedAtDesc(deck.getId()).stream()
                    .filter(log -> DeckModerationLog.Action.REJECT == log.getAction())
                    .map(DeckModerationLog::getNote)
                    .findFirst()
                    .orElse(null);
            deck.setVerificationNote(latestNote);
        }

        return toSummary(deck);
    }

    @Transactional
    public DeckSummaryResponse createDeck(CreateDeckRequest request, UserPrincipal principal) {
        Deck deck = new Deck();
        deck.setSlug(uniqueSlugForOwner(principal.getId(), request.slug(), request.title()));
        deck.setTitle(request.title());
        deck.setDescription(request.description());
        deck.setCoverImageUrl(request.coverImageUrl());
        deck.setOwnerId(principal.getId());
        if ("ADMIN".equals(principal.getRole())) {
            deck.setOwnerType(Deck.OwnerType.ADMIN);
            deck.setSourceType("OFFICIAL");
            deck.setXpMultiplier(1.0);
            deck.setPublic(false); // admin publishes manually via Publish button
            deck.setCopyable(true);
        } else {
            deck.setOwnerType(Deck.OwnerType.USER);
            deck.setSourceType("PERSONAL");
            deck.setXpMultiplier(0.1);
            deck.setPublic(false);
            deck.setCopyable(true);
        }
        if (request.languageFront() != null) {
            deck.setLanguageFront(request.languageFront());
        }
        if (request.languageBack() != null) {
            deck.setLanguageBack(request.languageBack());
        }
        Deck saved = deckRepository.save(deck);
        if (request.topicIds() != null) {
            replaceTopics(saved, request.topicIds(), principal);
        }
        return toSummary(saved);
    }

    @Transactional
    public DeckSummaryResponse submitForApproval(String deckRef, UserPrincipal principal,
            SubmitDeckApprovalRequest request) {
        Deck deck = findOwnedDeck(deckRef, principal);
        if (!"PERSONAL".equals(deck.getSourceType()) && !"REJECTED".equals(deck.getVerificationStatus())) {
            throw new BadRequestException("Only personal decks can be submitted for approval");
        }
        if (deck.getVerificationStatus() != null && !"REJECTED".equals(deck.getVerificationStatus())) {
            throw new BadRequestException("Deck is already in review");
        }

        // Apply optional description and requested topic from request
        if (request != null) {
            if (request.description() != null && !request.description().isBlank()) {
                deck.setDescription(request.description().trim());
            }
            // User's topic suggestion — admin will decide whether to create or assign
            if (request.requestedTopic() != null && !request.requestedTopic().isBlank()) {
                deck.setRequestedTopic(request.requestedTopic().trim());
            }
            // Attach existing topics only — admin controls topic creation
            if (request.topicIds() != null && !request.topicIds().isEmpty()) {
                deckTopicRepository.deleteAllByDeckId(deck.getId());
                for (UUID tid : request.topicIds()) {
                    deckTopicRepository.save(new DeckTopic(new DeckTopicId(deck.getId(), tid)));
                }
            }
        }

        deck.setSourceType("COMMUNITY");
        deck.setVerificationStatus("PENDING");
        deck.setXpMultiplier(0.1);
        deckRepository.save(deck);

        deckModerationLogRepository.save(new DeckModerationLog(
                deck, userRepository.getReferenceById(principal.getId()), DeckModerationLog.Action.SUBMIT, null));

        return toSummary(deck);
    }

    @Transactional
    public DeckSummaryResponse approveDeck(String deckRef, UserPrincipal principal, String note) {
        requireAdmin(principal.getRole());
        Deck deck = resolveDeckRef(deckRef, principal.getId());
        if (!"PENDING".equals(deck.getVerificationStatus())) {
            throw new BadRequestException("Deck is not pending approval");
        }

        deck.setVerificationStatus("APPROVED");
        deck.setVerifiedAt(Instant.now());
        deck.setVerifiedById(principal.getId());
        deck.setVerificationNote(blankToNull(note));
        deck.setPublic(true);
        deck.setXpMultiplier(1.0);
        deckRepository.save(deck);

        deckModerationLogRepository.save(new DeckModerationLog(
                deck, userRepository.getReferenceById(principal.getId()), DeckModerationLog.Action.APPROVE, blankToNull(note)));

        return toSummary(deck);
    }

    @Transactional
    public DeckSummaryResponse rejectDeck(String deckRef, UserPrincipal principal, String note) {
        requireAdmin(principal.getRole());
        Deck deck = resolveDeckRef(deckRef, principal.getId());
        if (!"PENDING".equals(deck.getVerificationStatus())) {
            throw new BadRequestException("Deck is not pending approval");
        }

        deck.setVerificationStatus("REJECTED");
        deck.setVerifiedAt(Instant.now());
        deck.setVerifiedById(principal.getId());
        deck.setVerificationNote(blankToNull(note));
        deck.setPublic(false);
        deck.setSourceType("PERSONAL");
        deck.setXpMultiplier(0.1);
        deckRepository.save(deck);

        deckModerationLogRepository.save(new DeckModerationLog(
                deck, userRepository.getReferenceById(principal.getId()), DeckModerationLog.Action.REJECT, blankToNull(note)));

        return toSummary(deck);
    }

    @Transactional
    public DeckSummaryResponse updateDeck(String deckRef, UpdateDeckRequest request, UserPrincipal principal) {
        Deck deck = findOwnedDeck(deckRef, principal);
        if (request.slug() != null) {
            assignSlug(deck, request.slug(), principal.getId());
        }
        if (request.title() != null) {
            boolean titleChanged = !request.title().equals(deck.getTitle());
            deck.setTitle(request.title());
            if (titleChanged && request.slug() == null) {
                String candidateSlug = com.backend.lumotus.util.SlugUtils.slugify(request.title());
                if (!deck.getSlug().equals(candidateSlug)) {
                    deck.setSlug(uniqueSlugForOwner(principal.getId(), null, request.title()));
                }
            }
        }
        if (request.description() != null) {
            deck.setDescription(request.description());
        }
        if (request.coverImageUrl() != null) {
            deck.setCoverImageUrl(request.coverImageUrl());
        }
        if (request.isPublic() != null) {
            deck.setPublic(request.isPublic());
        }
        if (request.isCopyable() != null) {
            deck.setCopyable(request.isCopyable());
        }
        if (request.languageFront() != null) {
            deck.setLanguageFront(request.languageFront());
        }
        if (request.languageBack() != null) {
            deck.setLanguageBack(request.languageBack());
        }
        Deck saved = deckRepository.save(deck);
        if (request.topicIds() != null) {
            replaceTopics(saved, request.topicIds(), principal);
        } else if (Boolean.FALSE.equals(request.isPublic())) {
            deckTopicRepository.deleteAllByDeckId(saved.getId());
        }
        return toSummary(saved);
    }

    @Transactional
    public void deleteDeck(String deckRef, UserPrincipal principal) {
        Deck deck = findOwnedDeck(deckRef, principal);
        if (deck.isPublic()) {
            throw new BadRequestException("Cannot delete a deck that is visible on Explore. Unpublish it first.");
        }
        deck.markDeleted();
        deckRepository.save(deck);
    }

    @Transactional
    public void hardDeleteDeck(String deckRef, UserPrincipal principal) {
        Deck deck = findOwnedDeck(deckRef, principal);
        UUID deckId = deck.getId();

        // Delete quiz-related data (quizzes belong to deck, not deck_id FK directly)
        List<Quiz> quizzes = quizRepository.findByDeckId(deckId);
        for (Quiz quiz : quizzes) {
            UUID quizId = quiz.getId();
            quizAnswerRepository.deleteAllByQuizId(quizId);
            quizAttemptRepository.deleteAllByQuizId(quizId);
            quizQuestionRepository.deleteByQuizId(quizId);
        }
        quizRepository.deleteAllByDeckId(deckId);

        // Delete deck-related data
        userCardReviewRepository.deleteAllByDeckId(deckId);
        userDeckProgressRepository.deleteAllByDeckId(deckId);
        cardRepository.deleteAllByDeckId(deckId);
        deckTagRepository.deleteAllByDeckId(deckId);
        deckTopicRepository.deleteAllByDeckId(deckId);
        deckModerationLogRepository.deleteAllByDeckId(deckId);
        deckRepository.delete(deck);
    }

    @Transactional
    public DeckSummaryResponse copyDeck(String sourceRef, UserPrincipal principal) {
        Deck source = resolveViewableDeck(sourceRef, principal);
        if (!source.isPublic()) {
            throw new ForbiddenException("Deck is not public");
        }
        if (!source.isCopyable()) {
            throw new BadRequestException("Deck is not copyable");
        }
        if (source.getOwnerId().equals(principal.getId())) {
            throw new BadRequestException("Cannot copy your own deck");
        }

        Deck copy = new Deck();
        copy.setSlug(uniqueSlugForOwner(principal.getId(), null, source.getTitle()));
        copy.setTitle(source.getTitle());
        copy.setDescription(source.getDescription());
        copy.setCoverImageUrl(source.getCoverImageUrl());
        copy.setOwnerId(principal.getId());
        copy.setOwnerType(Deck.OwnerType.USER);
        copy.setPublic(false);
        copy.setCopyable(true);
        copy.setLanguageFront(source.getLanguageFront());
        copy.setLanguageBack(source.getLanguageBack());
        copy.setSourceDeckId(source.getId());
        copy.setSourceType("CLONE");
        copy.setXpMultiplier(0.1);
        Deck savedCopy = deckRepository.save(copy);

        for (Card sourceCard : cardRepository.findByDeckIdOrderBySortOrderAsc(source.getId())) {
            Card card = new Card();
            card.setDeckId(savedCopy.getId());
            card.setFront(sourceCard.getFront());
            card.setBack(sourceCard.getBack());
            card.setPhonetic(sourceCard.getPhonetic());
            card.setPartOfSpeech(sourceCard.getPartOfSpeech());
            card.setHint(sourceCard.getHint());
            card.setExample(sourceCard.getExample());
            card.setImageUrl(sourceCard.getImageUrl());
            card.setIcon(sourceCard.getIcon());
            card.setAudioUrl(sourceCard.getAudioUrl());
            card.setDifficulty(sourceCard.getDifficulty());
            card.setSortOrder(sourceCard.getSortOrder());
            cardRepository.save(card);
        }

        for (DeckTopic link : deckTopicRepository.findByIdDeckId(source.getId())) {
            deckTopicRepository.save(new DeckTopic(new DeckTopicId(savedCopy.getId(), link.getId().getTopicId())));
        }

        source.setCopyCount(source.getCopyCount() + 1);
        deckRepository.save(source);

        return toSummary(savedCopy);
    }

    @Transactional(readOnly = true)
    public PageResponse<CardResponse> listCards(
            String deckRef, UserPrincipal principal, int page, int size, String q) {
        Deck deck = resolveViewableDeck(deckRef, principal);
        int pageSize = size > 0 ? size : DEFAULT_CARD_PAGE_SIZE;
        Page<Card> cards = cardRepository.searchByDeckId(
                deck.getId(), blankToNull(q), PageRequest.of(page, pageSize));
        return PageResponse.from(cards.map(CardResponse::from));
    }

    @Transactional
    public CardResponse addCard(String deckRef, CreateCardRequest request, UserPrincipal principal) {
        Deck deck = findOwnedDeck(deckRef, principal);
        Card card = new Card();
        card.setDeckId(deck.getId());
        card.setFront(request.front());
        card.setBack(request.back());
        card.setPhonetic(request.phonetic());
        card.setPartOfSpeech(request.partOfSpeech());
        card.setHint(request.hint());
        card.setExample(request.example());
        card.setImageUrl(request.imageUrl());
        card.setIcon(request.icon());
        card.setAudioUrl(request.audioUrl());
        card.setDifficulty(request.difficulty());
        card.setSortOrder(
                request.sortOrder() != null
                        ? request.sortOrder()
                        : cardRepository.findMaxSortOrder(deck.getId()) + 1);
        return CardResponse.from(cardRepository.save(card));
    }

    @Transactional
    public CardResponse updateCard(
            String deckRef, UUID cardId, UpdateCardRequest request, UserPrincipal principal) {
        Deck deck = findOwnedDeck(deckRef, principal);
        Card card = cardRepository
                .findByIdAndDeckId(cardId, deck.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));
        if (request.front() != null) {
            card.setFront(request.front());
        }
        if (request.back() != null) {
            card.setBack(request.back());
        }
        if (request.phonetic() != null) {
            card.setPhonetic(request.phonetic());
        }
        if (request.partOfSpeech() != null) {
            card.setPartOfSpeech(request.partOfSpeech());
        }
        if (request.hint() != null) {
            card.setHint(request.hint());
        }
        if (request.example() != null) {
            card.setExample(request.example());
        }
        if (request.imageUrl() != null) {
            card.setImageUrl(request.imageUrl());
        }
        if (request.icon() != null) {
            card.setIcon(request.icon());
        }
        if (request.audioUrl() != null) {
            card.setAudioUrl(request.audioUrl());
        }
        if (request.difficulty() != null) {
            card.setDifficulty(request.difficulty());
        }
        if (request.sortOrder() != null) {
            card.setSortOrder(request.sortOrder());
        }
        return CardResponse.from(cardRepository.save(card));
    }

    @Transactional
    public ImportDeckResponse importCsv(
            MultipartFile file, String title, String deckRef, List<UUID> topicIds, UserPrincipal principal) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("CSV file is required");
        }
        String filename = file.getOriginalFilename();
        if (filename != null && !filename.toLowerCase().endsWith(".csv")) {
            throw new BadRequestException("Only CSV files are supported");
        }

        ParseResult parsed;
        try {
            parsed = CsvDeckImporter.parse(file.getInputStream());
        } catch (IOException ex) {
            throw new BadRequestException("Failed to read CSV file");
        }

        Deck deck;
        String deckTitle = blankToNull(title);
        if (deckRef != null && !deckRef.isBlank()) {
            deck = findOwnedDeck(deckRef, principal);
        } else {
            if (deckTitle == null) {
                deckTitle = deriveTitleFromFilename(filename);
            }
            deck = new Deck();
            deck.setSlug(uniqueSlugForOwner(principal.getId(), null, deckTitle));
            deck.setTitle(deckTitle);
            deck.setOwnerId(principal.getId());
            if ("ADMIN".equals(principal.getRole())) {
                deck.setOwnerType(Deck.OwnerType.ADMIN);
                deck.setSourceType("OFFICIAL");
                deck.setXpMultiplier(1.0);
            } else {
                deck.setOwnerType(Deck.OwnerType.USER);
                deck.setSourceType("PERSONAL");
                deck.setXpMultiplier(0.1);
            }
            deck.setPublic(false);
            deck.setCopyable(true);
            deck = deckRepository.save(deck);
        }

        // Attach topics to newly created deck
        if (topicIds != null && !topicIds.isEmpty()) {
            for (UUID tid : topicIds) {
                deckTopicRepository.save(new DeckTopic(new DeckTopicId(deck.getId(), tid)));
            }
        }

        int sortBase = cardRepository.findMaxSortOrder(deck.getId()) + 1;
        List<ImportRow> rows = CsvDeckImporter.dedupeByFront(parsed.rows());

        Map<String, Card> existingByFront = new HashMap<>();
        for (Card existing : cardRepository.findByDeckIdOrderBySortOrderAsc(deck.getId())) {
            existingByFront.putIfAbsent(CsvDeckImporter.normalizeFrontKey(existing.getFront()), existing);
        }

        int added = 0;
        int updated = 0;
        List<Card> toSave = new ArrayList<>();
        for (ImportRow row : rows) {
            String key = CsvDeckImporter.normalizeFrontKey(row.front());
            Card existing = existingByFront.get(key);
            if (existing != null) {
                applyImportRow(existing, row);
                toSave.add(existing);
                updated++;
            } else {
                Card card = new Card();
                card.setDeckId(deck.getId());
                applyImportRow(card, row);
                card.setSortOrder(sortBase + added);
                toSave.add(card);
                existingByFront.put(key, card);
                added++;
            }
        }
        cardRepository.saveAll(toSave);

        return new ImportDeckResponse(
                toSummary(deck), added, updated, parsed.errors().size(), List.copyOf(parsed.errors()));
    }

    private static void applyImportRow(Card card, ImportRow row) {
        card.setFront(row.front());
        card.setBack(row.back());
        card.setPhonetic(row.phonetic());
        card.setPartOfSpeech(row.partOfSpeech());
        card.setExample(row.example());
        card.setHint(row.hint());
        card.setImageUrl(row.imageUrl());
        card.setIcon(row.icon());
    }

    @Transactional
    public void deleteCard(String deckRef, UUID cardId, UserPrincipal principal) {
        Deck deck = findOwnedDeck(deckRef, principal);
        Card card = cardRepository
                .findByIdAndDeckId(cardId, deck.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));
        card.markDeleted();
        cardRepository.save(card);
    }

    private Deck resolveViewableDeck(String deckRef, UserPrincipal principal) {
        Deck deck = resolveDeckRef(deckRef, principal.getId());
        assertCanView(deck, principal);
        return deck;
    }

    private Deck findOwnedDeck(String deckRef, UserPrincipal principal) {
        Deck deck;
        boolean isAdmin = "ADMIN".equals(principal.getRole());

        if (SlugUtils.isUuid(deckRef)) {
            UUID id = SlugUtils.parseUuid(deckRef);
            if (isAdmin) {
                deck = deckRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
            } else {
                deck = deckRepository.findByIdAndOwnerId(id, principal.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
            }
        } else {
            if (isAdmin) {
                deck = deckRepository.findAll().stream()
                        .filter(d -> deckRef.equals(d.getSlug()))
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
            } else {
                deck = deckRepository.findByOwnerIdAndSlug(principal.getId(), deckRef)
                        .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
            }
        }

        // Users cannot modify OFFICIAL decks
        if (!isAdmin && "OFFICIAL".equals(deck.getSourceType())) {
            throw new ForbiddenException("Admin decks cannot be modified by users");
        }
        return deck;
    }

    private Deck resolveDeckRef(String deckRef, UUID userId) {
        if (SlugUtils.isUuid(deckRef)) {
            return deckRepository
                    .findById(SlugUtils.parseUuid(deckRef))
                    .orElseThrow(() -> new ResourceNotFoundException("Deck not found"));
        }
        List<Deck> matches = deckRepository.findAccessibleBySlug(userId, deckRef);
        if (matches.isEmpty()) {
            throw new ResourceNotFoundException("Deck not found");
        }
        if (matches.size() == 1) {
            return matches.get(0);
        }
        // If there are multiple matches (legacy duplicate slugs), prioritize:
        // 1. Owned by the current user
        // 2. Pending approval
        // 3. Official deck
        // 4. Default to first match
        return matches.stream()
                .filter(d -> d.getOwnerId().equals(userId))
                .findFirst()
                .orElseGet(() -> matches.stream()
                        .filter(d -> "PENDING".equals(d.getVerificationStatus()))
                        .findFirst()
                        .orElseGet(() -> matches.stream()
                                .filter(d -> "OFFICIAL".equals(d.getSourceType()))
                                .findFirst()
                                .orElse(matches.get(0))));
    }

    private UUID resolveTopicId(UUID topicId, String topicSlug) {
        if (topicId != null) {
            return topicId;
        }
        String slug = blankToNull(topicSlug);
        if (slug == null) {
            return null;
        }
        return topicRepository
                .findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + slug))
                .getId();
    }

    private String uniqueSlugForOwner(UUID ownerId, String requestedSlug, String title) {
        String base = requestedSlug != null && !requestedSlug.isBlank()
                ? requestedSlug.trim()
                : SlugUtils.slugify(title);
        if (!SlugUtils.isValidSlug(base)) {
            throw new BadRequestException("Invalid slug format");
        }
        if (deckRepository.existsBySlug(base)) {
            String candidate = base + "-" + UUID.randomUUID().toString().substring(0, 6);
            while (deckRepository.existsBySlug(candidate)) {
                candidate = base + "-" + UUID.randomUUID().toString().substring(0, 6);
            }
            return candidate;
        }
        return base;
    }

    private void assignSlug(Deck deck, String newSlug, UUID ownerId) {
        if (!SlugUtils.isValidSlug(newSlug)) {
            throw new BadRequestException("Invalid slug format");
        }
        if (deckRepository.existsBySlug(newSlug)
                && !newSlug.equals(deck.getSlug())) {
            throw new ConflictException("Deck slug already exists");
        }
        deck.setSlug(newSlug);
    }

    private void assertCanView(Deck deck, UserPrincipal principal) {
        if (!deck.isPublic() && !deck.getOwnerId().equals(principal.getId())) {
            throw new ForbiddenException("Deck is private");
        }
    }

    private DeckSummaryResponse toSummary(Deck deck) {
        long cardCount = cardRepository.countByDeckId(deck.getId());
        List<TopicResponse> topics = deckTopicRepository.findByIdDeckId(deck.getId()).stream()
                .map(link -> topicRepository.findById(link.getId().getTopicId()))
                .flatMap(java.util.Optional::stream)
                .map(TopicResponse::from)
                .toList();
        String ownerUsername = userRepository
                .findById(deck.getOwnerId())
                .map(u -> u.getUsername())
                .orElse("unknown");
        
        if (Deck.OwnerType.ADMIN.equals(deck.getOwnerType())) {
            ownerUsername = null;
        }

        DeckSummaryResponse.SourceMeta source = resolveSourceMeta(deck.getSourceDeckId());
        return DeckSummaryResponse.from(deck, cardCount, topics, ownerUsername, source);
    }

    private DeckSummaryResponse.SourceMeta resolveSourceMeta(UUID sourceDeckId) {
        if (sourceDeckId == null) {
            return null;
        }
        return deckRepository
                .findById(sourceDeckId)
                .map(source -> {
                    String sourceOwner = userRepository
                            .findById(source.getOwnerId())
                            .map(u -> u.getUsername())
                            .orElse("unknown");
                    return new DeckSummaryResponse.SourceMeta(
                            source.getId(), source.getSlug(), source.getTitle(), sourceOwner);
                })
                .orElse(null);
    }

    private void replaceTopics(Deck deck, List<UUID> topicIds, UserPrincipal principal) {
        List<UUID> normalized = normalizeTopicIds(topicIds);
        boolean isAdmin = "ADMIN".equals(principal.getRole());
        
        if (!isAdmin && !deck.isPublic() && !normalized.isEmpty()) {
            throw new BadRequestException(
                    "Chủ đề hệ thống chỉ gắn được với deck công khai — bật Công khai hoặc bỏ chọn chủ đề");
        }
        deckTopicRepository.deleteAllByDeckId(deck.getId());
        for (UUID topicId : normalized) {
            Topic topic = topicRepository
                    .findById(topicId)
                    .orElseThrow(() -> new ResourceNotFoundException("Topic not found: " + topicId));
            DeckTopic dt = new DeckTopic(new DeckTopicId(deck.getId(), topic.getId()));
            dt.setTopic(topic);
            deckTopicRepository.save(dt);
        }
    }

    /** Bỏ null / trùng — tránh lỗi khi Postman gửi `{{topicId}}` rỗng. */
    private List<UUID> normalizeTopicIds(List<UUID> topicIds) {
        if (topicIds == null) {
            return List.of();
        }
        return topicIds.stream().filter(Objects::nonNull).distinct().toList();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void requireAdmin(String userRole) {
        if (!"ADMIN".equals(userRole)) {
            throw new ForbiddenException("Admin access required");
        }
    }

    private String deriveTitleFromFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "Imported deck";
        }
        String name = filename;
        int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }
        if (name.toLowerCase().endsWith(".csv")) {
            name = name.substring(0, name.length() - 4);
        }
        return name.isBlank() ? "Imported deck" : name.trim();
    }
}
