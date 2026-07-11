package com.backend.lumotus;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import com.backend.lumotus.dto.request.RegisterRequest;
import com.backend.lumotus.service.AuthService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

@SpringBootTest
@Transactional
public class FlashcardIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AuthService authService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private String jwtToken;
    private String deckId;

    private String getUniqueStr() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    @BeforeEach
    void setup() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        
        String randomStr = getUniqueStr();
        var res = authService.register(new RegisterRequest("tester_" + randomStr, "tester_" + randomStr + "@example.com", "Password123!"));
        jwtToken = res.toResponse().accessToken();

        // Tạo deck
        String randomSlug = "fc-deck-" + randomStr;
        String deckJson = String.format("""
                {
                  "title": "Flashcard Deck",
                  "slug": "%s",
                  "isPublic": true
                }
                """, randomSlug);

        MvcResult deckResult = mockMvc.perform(post("/api/v1/decks")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deckJson))
                .andReturn();
        deckId = objectMapper.readTree(deckResult.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    @DisplayName("Thêm thẻ, kiểm tra thẻ tới hạn, và trắc nghiệm thẻ (Rate Card)")
    void testFlashcardLifecycle() throws Exception {
        // 1. Thêm Card vào Deck
        String addCardJson = """
                {
                  "front": "What is Java?",
                  "back": "A programming language",
                  "orderIndex": 1
                }
                """;

        MvcResult addCardResult = mockMvc.perform(post("/api/v1/decks/" + deckId + "/cards")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(addCardJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.front").value("What is Java?"))
                .andReturn();

        JsonNode root = objectMapper.readTree(addCardResult.getResponse().getContentAsString());
        String cardId = root.get("id").asText();

        // 2. Lấy thẻ tới hạn
        mockMvc.perform(get("/api/v1/flashcards/due")
                        .param("deckId", deckId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueCount").exists())
                .andExpect(jsonPath("$.cards").exists());

        // 3. Chấm điểm thẻ (RATE)
        String rateJson = """
                {
                  "rating": "GOOD"
                }
                """;

        mockMvc.perform(post("/api/v1/flashcards/" + cardId + "/rate")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextReviewAt").exists());
    }

    @Test
    @DisplayName("Cập nhật thẻ và Xoá thẻ thành công")
    void updateAndDeleteCard() throws Exception {
        // Thêm thẻ để test
        String addJson = """
                {
                  "front": "Old Front",
                  "back": "Old Back",
                  "orderIndex": 1
                }
                """;
        MvcResult cardResult = mockMvc.perform(post("/api/v1/decks/" + deckId + "/cards").header("Authorization", "Bearer " + jwtToken).contentType(MediaType.APPLICATION_JSON).content(addJson)).andReturn();
        String cardIdToUpdate = objectMapper.readTree(cardResult.getResponse().getContentAsString()).get("id").asText();

        // Update
        String updateJson = """
                {
                  "front": "New Front",
                  "back": "New Back",
                  "orderIndex": 1
                }
                """;
        mockMvc.perform(put("/api/v1/decks/" + deckId + "/cards/" + cardIdToUpdate)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.front").value("New Front"));

        // Delete
        mockMvc.perform(delete("/api/v1/decks/" + deckId + "/cards/" + cardIdToUpdate)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Lấy danh sách tất cả thẻ trong một Deck")
    void listDeckCards() throws Exception {
        mockMvc.perform(get("/api/v1/decks/" + deckId + "/cards")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").exists());
    }
}
