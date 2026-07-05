-- Sync question_count column with actual quiz_questions count
UPDATE quizzes q
SET question_count = (
    SELECT COUNT(*)
    FROM quiz_questions qq
    WHERE qq.quiz_id = q.id
);
