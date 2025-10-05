ALTER TABLE words ADD COLUMN normalized_term VARCHAR(120);
UPDATE words SET normalized_term = LOWER(TRIM(term)) WHERE normalized_term IS NULL;
ALTER TABLE words MODIFY normalized_term VARCHAR(120) NOT NULL;
ALTER TABLE words ADD CONSTRAINT uk_words_normalized_language_flavor UNIQUE (normalized_term, language, flavor);
