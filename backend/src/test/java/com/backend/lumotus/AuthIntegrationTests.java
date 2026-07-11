package com.backend.lumotus;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import com.backend.lumotus.dto.request.RegisterRequest;
import com.backend.lumotus.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

@SpringBootTest
@Transactional
public class AuthIntegrationTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AuthService authService;

    private MockMvc mockMvc;

    private String getUniqueStr() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    @DisplayName("Đăng ký tài khoản thành công")
    void registerSuccess() throws Exception {
        String randomStr = getUniqueStr();
        String json = String.format("""
                {
                  "username": "tester_%s",
                  "email": "tester_%s@example.com",
                  "password": "Password123!"
                }
                """, randomStr, randomStr);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.user.username").value("tester_" + randomStr));
    }

    @Test
    @DisplayName("Đăng nhập nhận JWT Token")
    void loginSuccess() throws Exception {
        String randomStr = getUniqueStr();
        String username = "tester_" + randomStr;
        String email = username + "@example.com";
        String password = "Password123!";
        
        authService.register(new RegisterRequest(username, email, password));

        String json = String.format("""
                {
                  "email": "%s",
                  "password": "%s"
                }
                """, email, password);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());
    }

    @Test
    @DisplayName("Bảo mật: Từ chối truy cập nếu thiếu Token")
    void unauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized()); 
    }

    @Test
    @DisplayName("Đăng ký thất bại: Trùng Username hoặc Email")
    void registerDuplicate() throws Exception {
        String randomStr = getUniqueStr();
        String json = String.format("""
                {
                  "username": "dup_%s",
                  "email": "dup_%s@example.com",
                  "password": "Password123!"
                }
                """, randomStr, randomStr);

        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated());

        // Đăng ký lại
        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isConflict()); // 409
    }

    @Test
    @DisplayName("Đăng nhập thất bại: Sai mật khẩu")
    void loginWrongPassword() throws Exception {
        String randomStr = getUniqueStr();
        authService.register(new RegisterRequest("tester_" + randomStr, "tester_" + randomStr + "@example.com", "Password123!"));

        String loginJson = String.format("""
                {
                  "email": "tester_%s@example.com",
                  "password": "WrongPassword!"
                }
                """, randomStr);

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginJson))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Lấy thông tin tài khoản (GET /me) thành công")
    void getMeSuccess() throws Exception {
        String randomStr = getUniqueStr();
        var res = authService.register(new RegisterRequest("me_" + randomStr, "me_" + randomStr + "@example.com", "Password123!"));
        String jwtToken = res.toResponse().accessToken();

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("me_" + randomStr));
    }
}
