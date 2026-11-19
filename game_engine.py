# Become the Leader - Game Engine
import math
import json
from pathlib import Path

MAX_ROUNDS = 10

# Temporary starting values for testing
INITIAL_STATS = {
    "ECO": 65,
    "HAP": 70,
    "ENV": 70,
    "SEC": 60
}

def new_game(difficulty="medium"):
    game = {
        "round": 1,
        "difficulty": difficulty,
        "indicators": INITIAL_STATS.copy(),
        "status": "playing"
    }

    return game

def update_indicators(game, changes):
    for indicator, change in changes.items():
        if indicator not in game["indicators"]:
            raise ValueError("Unknown indicator")

        old_value = game["indicators"][indicator]
        new_value = old_value + change

        # Keep values between 0 and 100
        game["indicators"][indicator] = max(
            0, min(100, new_value)
        )

    return game

WIN_REQUIREMENTS = {
    "ECO": 70,
    "ENV": 75,
    "HAP": 80
}

DIFFICULTY_RULES = {
    "easy": {
        "threshold": 10,
        "sec_threshold": 20,
        "negative_multiplier": 0.60
    },
    "medium": {
        "threshold": 20,
        "sec_threshold": 40,
        "negative_multiplier": 0.80
    },
    "hard": {
        "threshold": 30,
        "sec_threshold": 50,
        "negative_multiplier": 1.10
    }
}

def finish_round(game):
    if game["status"] != "playing":
        return game

    indicators = game["indicators"]
    difficulty = game["difficulty"]

    rules = DIFFICULTY_RULES[difficulty]

    # Check Game Over thresholds
    for name, value in indicators.items():

        if name == "SEC":
            limit = rules["sec_threshold"]
        else:
            limit = rules["threshold"]

        if value <= limit:
            game["status"] = "game_over"
            return game

    # Check victory conditions after round 10
    if game["round"] == MAX_ROUNDS:

        if all(
            indicators[name] >= target
            for name, target in WIN_REQUIREMENTS.items()
        ):
            game["status"] = "victory"
        else:
            game["status"] = "defeat"

    else:
        game["round"] += 1

    return game


def apply_choice(game, effects):
    if game["status"] != "playing":
        raise ValueError("Game has already ended")

    difficulty = game["difficulty"]
    multiplier = DIFFICULTY_RULES[difficulty]["negative_multiplier"]

    adjusted_effects = {}

    for indicator, effect in effects.items():

        if effect < 0:
            # Round negative effects to nearest integer
            # Half values round away from zero
            adjusted = -math.floor(
                abs(effect) * multiplier + 0.5
            )
        else:
            adjusted = effect

        adjusted_effects[indicator] = adjusted

    update_indicators(game, adjusted_effects)
    finish_round(game)

    return game


def load_scenarios():
    file_path = Path(__file__).with_name("scenarios.json")

    with open(file_path, "r", encoding="utf-8") as file:
        scenarios = json.load(file)

    return scenarios


def play_choice(game, choice_id, scenarios):

    if game["status"] != "playing":
        raise ValueError("Game has already ended")

    current_round = game["round"]

    # Find scenario for the current round
    scenario = next(
        (s for s in scenarios if s["id"] == current_round),
        None
    )

    if scenario is None:
        raise ValueError("Scenario not found")

    # Find the selected policy
    choice = next(
        (c for c in scenario["choices"] if c["id"] == choice_id),
        None
    )

    if choice is None:
        raise ValueError("Invalid choice")

    # Apply effects and finish the round
    apply_choice(game, choice["effects"])

    return game

# First test
game = new_game("medium")

print("Initial state:", game)

update_indicators(game, {
    "ECO": 10,
    "ENV": -5,
    "HAP": 5,
    "SEC": 0
})

print("After decision:", game)

finish_round(game)

print("After finishing round:", game)

# TEST 1: GAME OVER
game_over = new_game("medium")

update_indicators(game_over, {"ECO": -60})
finish_round(game_over)

print("Game Over test:", game_over["status"])


# TEST 2: VICTORY
victory_game = new_game("medium")

victory_game["round"] = 10

victory_game["indicators"] = {
    "ECO": 70,
    "HAP": 80,
    "ENV": 75,
    "SEC": 60
}

finish_round(victory_game)

print("Victory test:", victory_game["status"])

assert victory_game["status"] == "victory"

# TEST 3: DEFEAT
defeat_game = new_game("medium")

defeat_game["round"] = 10

defeat_game["indicators"] = {
    "ECO": 70,
    "ENV": 74,
    "HAP": 80,
    "SEC": 50
}


# TEST 4: SECURITY THRESHOLD

security_test = new_game("medium")

security_test["indicators"]["SEC"] = 40

finish_round(security_test)

print("Security test:", security_test["status"])


# TEST 5: JUST ABOVE SECURITY LIMIT

safe_test = new_game("medium")

safe_test["indicators"]["SEC"] = 41

finish_round(safe_test)

print("Safe test:", safe_test["status"])
print("Safe round:", safe_test["round"])


finish_round(defeat_game)

print("Defeat test:", defeat_game["status"])

# TEST 6: APPLY OFFICIAL CHOICE

test_game = new_game("medium")

apply_choice(test_game, {
    "ECO": -3,
    "HAP": 2,
    "ENV": 8,
    "SEC": 6
})

print("Choice test:", test_game)

# TEST 8: PLAY USING JSON DATA

scenarios = load_scenarios()

demo_game = new_game("medium")

# Round 1: Invest in Nuclear Energy
play_choice(demo_game, "B", scenarios)

print("After Round 1:", demo_game)

# Round 2: Increase Public Education Funding
play_choice(demo_game, "A", scenarios)

print("After Round 2:", demo_game)



