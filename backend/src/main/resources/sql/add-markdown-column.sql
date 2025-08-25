ALTER TABLE words ADD COLUMN markdown TEXT;
UPDATE words SET markdown = '' WHERE markdown IS NULL;
