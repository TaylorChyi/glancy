ALTER TABLE words ADD COLUMN markdown TEXT;

UPDATE words w
SET w.markdown = (
    SELECT GROUP_CONCAT(d.definition SEPARATOR '\n')
    FROM word_definitions d
    WHERE d.word_id = w.id
)
WHERE w.markdown IS NULL;
