"""Smoke tests for Become the Leader's Flask API.

Run from the project root with:
    .\\.venv\\Scripts\\python.exe test_api_smoke.py

Uses an isolated temporary SQLite database: your real game.db is untouched.
"""
from pathlib import Path
from tempfile import TemporaryDirectory


def verify(response, expected_status, label):
    actual = response.status_code
    assert actual == expected_status, (
        f"{label}: expected HTTP {expected_status}, got {actual}: "
        f"{response.get_json()}"
    )
    print(f"PASS: {label} (HTTP {actual})")


with TemporaryDirectory() as directory:
    # Must set DB_PATH before importing app.py: app.py calls init_db().
    import game_storage
    game_storage.DB_PATH = Path(directory) / "smoke_test_game.db"

    import app
    app.app.config["TESTING"] = True

    with app.app.test_client() as client:
        # Start a new game.
        response = client.post("/api/start", json={})
        verify(response, 200, "Start game")
        first = response.get_json()
        assert first["game"]["indicators"] == {
            "ECO": 65, "HAP": 70, "ENV": 70, "SEC": 60
        }
        assert first["game"]["round"] == 1
        assert first["scenario"]["title"] == "Energy Crisis"
        assert len(first["scenario"]["choices"]) == 3
        assert all("effects" not in c for c in first["scenario"]["choices"])
        first_id = first["game_id"]
        print("PASS: Starting indicators and hidden policy effects")

        # Each player starts with an independent ID and state.
        second = client.post("/api/start", json={}).get_json()
        second_id = second["game_id"]
        assert first_id != second_id
        print("PASS: Two games have different IDs")

        # Round 1, Option B in Medium: ECO -3 * 0.80 -> -2.
        round_one = {"game_id": first_id, "round": 1, "choice_id": "B"}
        response = client.post("/api/choice", json=round_one)
        verify(response, 200, "Play Round 1 - B")
        outcome = response.get_json()
        expected = {"ECO": 63, "HAP": 72, "ENV": 78, "SEC": 66}
        assert outcome["after"] == expected, outcome
        assert outcome["game"]["round"] == 2
        assert game_storage.load_game(first_id)["indicators"] == expected
        assert game_storage.load_game(second_id)["round"] == 1
        print("PASS: Calculation, SQLite persistence, player isolation")

        # An old round cannot be submitted twice.
        verify(client.post("/api/choice", json=round_one), 409, "Replay blocked")
        assert game_storage.load_game(first_id)["round"] == 2

        # The current scenario only accepts its own choices (Round 2 has A/B).
        invalid = {"game_id": first_id, "round": 2, "choice_id": "C"}
        verify(client.post("/api/choice", json=invalid), 400, "Invalid policy blocked")
        verify(client.post("/api/choice", json={
            "game_id": "nonexistent", "round": 1, "choice_id": "A"
        }), 404, "Unknown game blocked")
        verify(client.post("/api/choice", data="not-json",
                           content_type="application/json"), 400, "Invalid JSON blocked")

        # Full 10-round path known to meet the currently configured Medium goals.
        victory_id = client.post("/api/start", json={}).get_json()["game_id"]
        path = ("A", "A", "A", "A", "A", "B", "A", "B", "A", "B")
        for round_number, choice in enumerate(path, start=1):
            response = client.post("/api/choice", json={
                "game_id": victory_id,
                "round": round_number,
                "choice_id": choice,
            })
            verify(response, 200, f"Full game Round {round_number}")
        finished = game_storage.load_game(victory_id)
        assert finished["round"] == 10
        assert finished["status"] == "victory", finished
        assert finished["indicators"] == {
            "ECO": 72, "HAP": 97, "ENV": 76, "SEC": 42
        }, finished
        print("PASS: Full 10 rounds ends in victory")

        verify(client.post("/api/choice", json={
            "game_id": victory_id, "round": 10, "choice_id": "B"
        }), 409, "Decisions after game end blocked")

print("ALL API SMOKE TESTS PASSED")
