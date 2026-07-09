package com.backend.lumotus;

import static org.junit.jupiter.api.Assertions.*;

import com.backend.lumotus.entity.Deck;
import com.backend.lumotus.entity.User;
import com.backend.lumotus.repository.DeckRepository;
import com.backend.lumotus.repository.UserRepository;
import com.backend.lumotus.service.DeckService;
import com.backend.lumotus.dto.request.CreateDeckRequest;
import com.backend.lumotus.security.UserPrincipal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class DeckSlugVerificationTest {

    @Autowired
    private DeckService deckService;

    @Autowired
    private DeckRepository deckRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testGloballyUniqueSlugs() {
        // Find or create a test user
        User user = new User();
        user.setUsername("testuser_" + UUID.randomUUID().toString().substring(0, 8));
        user.setEmail("test_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com");
        user.setPasswordHash("hashedpassword");
        user.setRole(User.Role.USER); // Set user role explicitly
        user = userRepository.save(user);

        UserPrincipal principal = new UserPrincipal(user);

        // Create first deck
        CreateDeckRequest request1 = new CreateDeckRequest("Vocabulary Test", null, "description", null, true, true, "en", "vi", null);
        var deck1 = deckService.createDeck(request1, principal);
        assertNotNull(deck1.slug());
        assertEquals("vocabulary-test", deck1.slug());

        // Create second deck with identical title
        CreateDeckRequest request2 = new CreateDeckRequest("Vocabulary Test", null, "description", null, true, true, "en", "vi", null);
        var deck2 = deckService.createDeck(request2, principal);
        assertNotNull(deck2.slug());
        
        // Slug should be unique globally (with a suffix)
        assertNotEquals("vocabulary-test", deck2.slug());
        assertTrue(deck2.slug().startsWith("vocabulary-test-"));
        assertEquals(22, deck2.slug().length()); // "vocabulary-test" (15) + "-" (1) + 6 chars = 22

        // Verify existsBySlug works
        assertTrue(deckRepository.existsBySlug(deck1.slug()));
        assertTrue(deckRepository.existsBySlug(deck2.slug()));
    }

    @Test
    void testResolveAmbiguousSlugs() {
        User user = new User();
        user.setUsername("testuser_" + UUID.randomUUID().toString().substring(0, 8));
        user.setEmail("test_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com");
        user.setPasswordHash("hashedpassword");
        user.setRole(User.Role.USER);
        user = userRepository.save(user);

        User otherUser = new User();
        otherUser.setUsername("otheruser_" + UUID.randomUUID().toString().substring(0, 8));
        otherUser.setEmail("other_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com");
        otherUser.setPasswordHash("hashedpassword");
        otherUser.setRole(User.Role.USER);
        otherUser = userRepository.save(otherUser);

        UserPrincipal principal = new UserPrincipal(user);

        // Create duplicate decks directly in DB to simulate legacy duplicates
        Deck duplicateDeck1 = new Deck();
        duplicateDeck1.setTitle("Duplicate Title");
        duplicateDeck1.setSlug("duplicate-slug");
        duplicateDeck1.setOwnerId(user.getId());
        duplicateDeck1.setOwnerType(com.backend.lumotus.entity.Deck.OwnerType.USER);
        duplicateDeck1.setLanguageFront("en");
        duplicateDeck1.setLanguageBack("vi");
        duplicateDeck1.setVerificationStatus("PENDING");
        duplicateDeck1 = deckRepository.save(duplicateDeck1);

        Deck duplicateDeck2 = new Deck();
        duplicateDeck2.setTitle("Duplicate Title");
        duplicateDeck2.setSlug("duplicate-slug");
        duplicateDeck2.setOwnerId(otherUser.getId()); // owned by otherUser
        duplicateDeck2.setOwnerType(com.backend.lumotus.entity.Deck.OwnerType.USER);
        duplicateDeck2.setLanguageFront("en");
        duplicateDeck2.setLanguageBack("vi");
        duplicateDeck2.setVerificationStatus("APPROVED");
        duplicateDeck2 = deckRepository.save(duplicateDeck2);

        // Get deck by slug - it should resolve to duplicateDeck1 (owned by user) without throwing BadRequestException!
        var resolved = deckService.getDeck("duplicate-slug", principal);
        assertNotNull(resolved);
        assertEquals(duplicateDeck1.getId(), resolved.id());
    }
}
