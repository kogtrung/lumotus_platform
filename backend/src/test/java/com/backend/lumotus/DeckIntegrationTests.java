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
public class DeckIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AuthService authService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private String jwtToken;

    private String getUniqueStr() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        
        String randomStr = getUniqueStr();
        var res = authService.register(new RegisterRequest("tester_" + randomStr, "tester_" + randomStr + "@example.com", "Password123!"));
        jwtToken = res.toResponse().accessToken();
    }

    @Test
    @DisplayName("Tạo Deck và Lấy Chi Tiết")
    void createAndGetDeck() throws Exception {
        String randomSlug = "deck-" + getUniqueStr();
        String json = String.format("""
                {
                  "title": "Deck test %s",
                  "description": "test",
                  "slug": "%s",
                  "isPublic": true
                }
                """, randomSlug, randomSlug);

        MvcResult result = mockMvc.perform(post("/api/v1/decks")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        String deckId = root.get("id").asText();

        mockMvc.perform(get("/api/v1/decks/" + deckId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(deckId));
    }

    @Test
    @DisplayName("Cập nhật Deck và xoá Deck (Soft Delete)")
    void updateAndDeleteDeck() throws Exception {
        String randomSlug = "deck-ops-" + getUniqueStr();
        String json = String.format("""
                {
                  "title": "Ops Deck",
                  "slug": "%s",
                  "isPublic": false
                }
                """, randomSlug);

        MvcResult result = mockMvc.perform(post("/api/v1/decks").header("Authorization", "Bearer " + jwtToken).contentType(MediaType.APPLICATION_JSON).content(json)).andReturn();
        String deckId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        // Update
        String updateJson = String.format("""
                {
                  "title": "Ops Deck Updated",
                  "slug": "%s"
                }
                """, randomSlug);
        mockMvc.perform(put("/api/v1/decks/" + deckId)
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Ops Deck Updated"));

        // Delete
        mockMvc.perform(delete("/api/v1/decks/" + deckId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNoContent()); // 204

        // Get 404 Not Found
        mockMvc.perform(get("/api/v1/decks/" + deckId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Lỗi Validation: Tạo Deck thiếu Tiêu đề")
    void createDeckValidationFailure() throws Exception {
        String json = """
                {
                  "title": "",
                  "slug": "empty-title"
                }
                """;

        mockMvc.perform(post("/api/v1/decks")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest()); // 400
    }
}
