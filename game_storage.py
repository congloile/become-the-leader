"""SQLite persistence for Become the Leader.

Connection context managers commit/rollback; closing() also closes the file
handle so temporary databases can be deleted on Windows.
"""

import json
import sqlite3
import uuid
from contextlib import closing
from pathlib import Path

DB_PATH = Path(__file__).with_name("game.db")


def init_db():
    with closing(sqlite3.connect(DB_PATH)) as conn:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS games (
                    game_id TEXT PRIMARY KEY,
                    state TEXT NOT NULL
                )
            """)


def save_game(game):
    game_id = str(uuid.uuid4())
    with closing(sqlite3.connect(DB_PATH)) as conn:
        with conn:
            conn.execute(
                "INSERT INTO games (game_id, state) VALUES (?, ?)",
                (game_id, json.dumps(game))
            )
    return game_id


def load_game(game_id):
    with closing(sqlite3.connect(DB_PATH)) as conn:
        row = conn.execute(
            "SELECT state FROM games WHERE game_id = ?",
            (game_id,)
        ).fetchone()
    return json.loads(row[0]) if row is not None else None


def update_game(game_id, game):
    with closing(sqlite3.connect(DB_PATH)) as conn:
        with conn:
            cursor = conn.execute(
                "UPDATE games SET state = ? WHERE game_id = ?",
                (json.dumps(game), game_id)
            )
            if cursor.rowcount == 0:
                raise ValueError("Game not found")


def update_game_if_unchanged(game_id, old_game, new_game):
    with closing(sqlite3.connect(DB_PATH, timeout=10)) as conn:
        with conn:
            cursor = conn.execute(
                """
                UPDATE games
                SET state = ?
                WHERE game_id = ? AND state = ?
                """,
                (json.dumps(new_game), game_id, json.dumps(old_game))
            )
            if cursor.rowcount != 1:
                raise ValueError("Game state has changed")

