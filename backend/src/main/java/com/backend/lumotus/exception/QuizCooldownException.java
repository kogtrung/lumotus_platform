package com.backend.lumotus.exception;

import com.backend.lumotus.dto.response.CooldownCheckResult;
import lombok.Getter;

@Getter
public class QuizCooldownException extends RuntimeException {

    private final CooldownCheckResult result;

    public QuizCooldownException(CooldownCheckResult result) {
        super(result.message());
        this.result = result;
    }

    public QuizCooldownException(String message, CooldownCheckResult result) {
        super(message);
        this.result = result;
    }
}
