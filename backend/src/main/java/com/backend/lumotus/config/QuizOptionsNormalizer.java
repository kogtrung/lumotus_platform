package com.backend.lumotus.config;

import com.backend.lumotus.entity.QuizQuestion;
import com.backend.lumotus.repository.QuizQuestionRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Normalize existing quiz question options to use letter prefixes (A., B., C., D.).
 * Old format: ["Option A", "Option B", "Option C", "Option D"]
 * New format: ["A. Option A", "B. Option B", "C. Option C", "D. Option D"]
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class QuizOptionsNormalizer implements CommandLineRunner {

    private final QuizQuestionRepository quizQuestionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public void run(String... args) {
        List<QuizQuestion> questions = quizQuestionRepository.findAll();
        int normalized = 0;
        String[] letters = {"A", "B", "C", "D"};

        for (QuizQuestion q : questions) {
            if (q.getOptions() == null || q.getOptions().isBlank()) continue;

            try {
                List<String> currentOptions = objectMapper.readValue(q.getOptions(), new TypeReference<>() {});
                if (currentOptions.isEmpty()) continue;

                // Check if already normalized (has letter prefix)
                boolean needsNormalization = false;
                for (String opt : currentOptions) {
                    if (opt != null && opt.length() > 2 && Character.isLetter(opt.charAt(0)) && opt.charAt(1) == '.') {
                        needsNormalization = false;
                        break;
                    }
                    needsNormalization = true;
                }

                if (needsNormalization) {
                    List<String> normalizedOptions = new ArrayList<>();
                    String correctAnswer = q.getCorrectAnswer();
                    String newCorrectAnswer = null;

                    for (int i = 0; i < currentOptions.size() && i < 4; i++) {
                        String opt = currentOptions.get(i);
                        if (opt != null && !opt.isBlank()) {
                            String prefixed = letters[i] + ". " + opt;
                            normalizedOptions.add(prefixed);

                            // Check if this option matches the correct answer (by text)
                            if (newCorrectAnswer == null && correctAnswer != null) {
                                String optLower = opt.toLowerCase().trim();
                                String ansLower = correctAnswer.toLowerCase().trim();
                                if (optLower.equals(ansLower) || prefixed.toLowerCase().equals(ansLower)) {
                                    newCorrectAnswer = letters[i];
                                }
                            }
                        }
                    }

                    // If correct answer is already a letter, keep it
                    if (newCorrectAnswer == null && correctAnswer != null
                            && correctAnswer.length() == 1
                            && "ABCD".contains(correctAnswer.toUpperCase())) {
                        newCorrectAnswer = correctAnswer.toUpperCase();
                    }

                    // Update question
                    q.setOptions(objectMapper.writeValueAsString(normalizedOptions));
                    if (newCorrectAnswer != null) {
                        q.setCorrectAnswer(newCorrectAnswer);
                    }
                    quizQuestionRepository.save(q);
                    normalized++;
                    log.info("Normalized quiz question {} - {} options", q.getId(), normalizedOptions.size());
                }
            } catch (Exception e) {
                log.warn("Failed to normalize options for question {}: {}", q.getId(), e.getMessage());
            }
        }

        if (normalized > 0) {
            log.info("QuizOptionsNormalizer: normalized {} questions", normalized);
        }
    }
}
