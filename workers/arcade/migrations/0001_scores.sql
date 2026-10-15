CREATE TABLE players (
	id TEXT PRIMARY KEY,
	token_hash TEXT NOT NULL,
	nickname TEXT NOT NULL CHECK(length(nickname) BETWEEN 1 AND 20),
	blocked INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE runs (
	id TEXT PRIMARY KEY,
	player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
	game TEXT NOT NULL,
	version INTEGER NOT NULL,
	score INTEGER NOT NULL CHECK(score >= 0 AND score <= 10000000),
	created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX runs_recent ON runs(game, version, created_at, player_id, score);
CREATE INDEX runs_player ON runs(player_id);

CREATE TABLE bests (
	player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
	game TEXT NOT NULL,
	version INTEGER NOT NULL,
	score INTEGER NOT NULL,
	achieved_at INTEGER NOT NULL,
	PRIMARY KEY(player_id, game, version)
);
CREATE INDEX bests_ranking ON bests(game, version, score DESC, achieved_at, player_id);

-- A duplicate run cannot change a personal best or its tie-break timestamp.
CREATE TRIGGER update_best AFTER INSERT ON runs BEGIN
	INSERT INTO bests(player_id, game, version, score, achieved_at)
	VALUES(NEW.player_id, NEW.game, NEW.version, NEW.score, NEW.created_at)
	ON CONFLICT(player_id, game, version) DO UPDATE SET
		score = excluded.score, achieved_at = excluded.achieved_at
	WHERE excluded.score > bests.score;
END;
