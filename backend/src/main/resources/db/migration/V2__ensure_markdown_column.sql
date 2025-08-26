-- Ensure markdown column exists for existing deployments
ALTER TABLE words
    ADD COLUMN IF NOT EXISTS markdown TEXT;

UPDATE words SET markdown = '' WHERE markdown IS NULL;
