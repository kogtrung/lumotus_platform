package com.backend.lumotus.security;

import com.backend.lumotus.config.GoogleProperties;
import com.backend.lumotus.exception.BadRequestException;
import com.backend.lumotus.exception.UnauthorizedException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.util.Collections;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class GoogleTokenVerifier {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenVerifier(GoogleProperties googleProperties) {
        String clientId = googleProperties.clientId();
        if (!StringUtils.hasText(clientId)) {
            this.verifier = null;
            return;
        }
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public GoogleUserInfo verify(String idToken) {
        if (verifier == null) {
            throw new BadRequestException("Google login is not configured");
        }
        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new UnauthorizedException("Invalid Google token");
            }
            GoogleIdToken.Payload payload = token.getPayload();
            if (!payload.getEmailVerified()) {
                throw new UnauthorizedException("Google email is not verified");
            }
            return new GoogleUserInfo(
                    payload.getSubject(),
                    payload.getEmail(),
                    (String) payload.get("name"),
                    (String) payload.get("picture"));
        } catch (UnauthorizedException | BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new UnauthorizedException("Invalid Google token");
        }
    }

    public record GoogleUserInfo(String subject, String email, String name, String pictureUrl) {
    }
}
