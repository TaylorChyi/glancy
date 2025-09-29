ALTER TABLE search_records
    ADD COLUMN IF NOT EXISTS target_language VARCHAR(16) NOT NULL DEFAULT 'CHINESE',
    ADD COLUMN IF NOT EXISTS flavor VARCHAR(32) NOT NULL DEFAULT 'BILINGUAL';

UPDATE search_records SET target_language = COALESCE(target_language, 'CHINESE');
UPDATE search_records SET flavor = COALESCE(flavor, 'BILINGUAL');

ALTER TABLE words
    ADD COLUMN IF NOT EXISTS target_language VARCHAR(16) NOT NULL DEFAULT 'CHINESE',
    ADD COLUMN IF NOT EXISTS flavor VARCHAR(32) NOT NULL DEFAULT 'BILINGUAL';

UPDATE words SET target_language = COALESCE(target_language, 'CHINESE');
UPDATE words SET flavor = COALESCE(flavor, 'BILINGUAL');

ALTER TABLE words DROP INDEX IF EXISTS uk_words_term_language;
ALTER TABLE words
    ADD CONSTRAINT uk_words_term_language_target_language_flavor
        UNIQUE (term, language, target_language, flavor);

ALTER TABLE search_result_versions
    ADD COLUMN IF NOT EXISTS target_language VARCHAR(16) NOT NULL DEFAULT 'CHINESE',
    ADD COLUMN IF NOT EXISTS flavor VARCHAR(32) NOT NULL DEFAULT 'BILINGUAL';

UPDATE search_result_versions SET target_language = COALESCE(target_language, 'CHINESE');
UPDATE search_result_versions SET flavor = COALESCE(flavor, 'BILINGUAL');
