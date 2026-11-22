
from copy import deepcopy
from game_engine import new_game
from game_storage import (
    init_db,
    save_game,
    load_game,
    update_game_if_unchanged
)

init_db()

game_id = save_game(new_game("medium"))

# Two requests read the same original state
request_a = load_game(game_id)
request_b = load_game(game_id)

# Request A changes ECO to 63
updated_a = deepcopy(request_a)
updated_a["indicators"]["ECO"] = 63

update_game_if_unchanged(
    game_id, request_a, updated_a
)

print("Request A: PASS")

# Request B tries to overwrite using old data
updated_b = deepcopy(request_b)
updated_b["indicators"]["ECO"] = 70

try:
    update_game_if_unchanged(
        game_id, request_b, updated_b
    )
    raise AssertionError("Stale update was accepted")
except ValueError:
    print("Request B: REJECTED")

# Verify that the first update was preserved
final_game = load_game(game_id)

assert final_game["indicators"]["ECO"] == 63

print("Final ECO:", final_game["indicators"]["ECO"])
print("Concurrency protection: PASS")
