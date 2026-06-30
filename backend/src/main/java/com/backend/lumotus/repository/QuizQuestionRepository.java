package com.backend.lumotus.repository;

import com.backend.lumotus.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {

    List<QuizQuestion> findByQuizIdOrderBySortOrderAsc(UUID quizId);

    void deleteByQuizId(UUID quizId);

    long countByQuizId(UUID quizId);
}
