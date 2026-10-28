CREATE TABLE IF NOT EXISTS catalog_cache (
	key TEXT PRIMARY KEY,
	value TEXT NOT NULL,
	expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS catalog_cache_expiry ON catalog_cache(expires);

-- One shared gate, including across Worker locations, for the public catalog.
CREATE TABLE IF NOT EXISTS catalog_gate (
	id INTEGER PRIMARY KEY CHECK (id = 1),
	next_at INTEGER NOT NULL
);
