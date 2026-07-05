-- Fix quiz_questions: map letter answers to actual text, strip prefixes from options
-- Root cause: CSV import stored letters (A/B/C/D) instead of actual answer text
-- and options had prefixes like "A. ", "B. " that needed stripping
-- This fixes both correct_answer and options columns

DO $$
DECLARE
    q RECORD;
    opts TEXT[];
    parts TEXT[];
    item TEXT;
    correct_idx INTEGER;
    new_correct TEXT;
    new_options TEXT;
    i INTEGER;
BEGIN
    FOR q IN
        SELECT id, correct_answer, options
        FROM quiz_questions
    LOOP
        BEGIN
            -- Parse options JSON array
            opts := ARRAY[]::TEXT[];
            parts := string_to_array(trim(translate(q.options, '[]', '')), ',');
            FOREACH item IN ARRAY parts LOOP
                item := trim(BOTH '"' FROM item);
                -- Strip "A. " or "B) " prefix
                IF length(item) > 2 AND substring(item, 2, 1) IN ('.', ')') THEN
                    item := trim(substring(item, 4));
                END IF;
                opts := array_append(opts, item);
            END LOOP;
            
            -- Map letter answer to text
            new_correct := q.correct_answer;
            IF q.correct_answer ~ '^[A-D]$' THEN
                correct_idx := ascii(q.correct_answer) - ascii('A') + 1;
                IF correct_idx >= 1 AND correct_idx <= array_length(opts, 1) THEN
                    new_correct := opts[correct_idx];
                END IF;
            END IF;
            
            -- Rebuild JSON array properly
            new_options := '[';
            FOR i IN 1..array_length(opts, 1) LOOP
                IF i > 1 THEN new_options := new_options || ','; END IF;
                new_options := new_options || '"' || replace(opts[i], '"', '""') || '"';
            END LOOP;
            new_options := new_options || ']';
            
            UPDATE quiz_questions
            SET correct_answer = new_correct,
                options = new_options,
                updated_at = NOW()
            WHERE id = q.id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error on question %: %', q.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Quiz questions fix completed: answers and options normalized';
END $$;
