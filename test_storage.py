from game_engine import new_game
from game_storage import init_db, save_game, load_game, update_game

init_db()

game = new_game("medium")

game_id = save_game(game)

print("Game ID:", game_id)

loaded_game = load_game(game_id)

print("Loaded game:", loaded_game)

assert loaded_game == game

print("Storage test: PASS")

# Test updating an existing game

loaded_game["indicators"]["ECO"] = 63

update_game(game_id, loaded_game)

updated_game = load_game(game_id)

assert updated_game["indicators"]["ECO"] == 63

print("Update game test: PASS")
