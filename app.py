from flask import Flask, jsonify, request, render_template
from game_engine import new_game, load_scenarios, play_choice
from copy import deepcopy
from game_storage import (
    init_db,
    save_game,
    load_game,
    update_game_if_unchanged,
    get_high_scores
)

app = Flask(__name__)

init_db()

def get_country_scenarios(country):
    return load_scenarios(country)

def public_scenario(scenario):
    return {
        "id": scenario["id"],
        "title": scenario["title"],
        "description": scenario.get("description", ""),
        "choices": [
            {
                "id": choice["id"],
                "text": choice["text"],
                "analysis": choice.get("analysis", {}),
            }
            for choice in scenario["choices"]
        ]
    }

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")


@app.route("/api/start", methods=["POST"])
def start_game():
    data = request.get_json(silent=True)

    # Validate JSON
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    name = data.get("name")
    country = data.get("country")
    difficulty = data.get("difficulty")

    # Validate player name
    if not isinstance(name, str):
        return jsonify({"error": "Invalid player name"}), 400

    name = name.strip()

    if not 1 <= len(name) <= 30:
        return jsonify({"error": "Name must be 1-30 characters"}), 400

    # Available countries
    if country not in ("finland", "newzealand"):
        return jsonify({"error": "Country not available"}), 400

    # Validate difficulty
    if difficulty not in ("easy", "medium", "hard"):
        return jsonify({"error": "Invalid difficulty"}), 400

    # Create game using selected difficulty
    game = new_game(difficulty, country)

    # Save player information
    game["player_name"] = name

    # Save game in SQLite
    game_id = save_game(game)

    return jsonify({
        "game_id": game_id,
        "game": game,
        "scenario": public_scenario(get_country_scenarios(country)[0])
    }), 200


@app.route("/setup", methods=["GET"])
def setup_page():
    return render_template("setup.html")

@app.route("/api/choice", methods=["POST"])
def choose_policy():
    data = request.get_json(silent=True)

    # Validate request format
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    game_id = data.get("game_id")
    choice_id = data.get("choice_id")
    requested_round = data.get("round")

    if (
        not isinstance(game_id, str)
        or not game_id
        or choice_id not in ("A", "B", "C")
        or type(requested_round) is not int
    ):
        return jsonify({"error": "Invalid request data"}), 400

    # Load saved game
    game = load_game(game_id)

    if game is None:
        return jsonify({"error": "Game not found"}), 404

    if game["status"] != "playing":
        return jsonify({"error": "Game already ended"}), 409

    # Prevent replaying an earlier round
    if requested_round != game["round"]:
        return jsonify({"error": "Wrong round"}), 409

    current_scenarios = get_country_scenarios(
    game.get("country", "finland"))

    # Find current scenario and selected choice
    scenario = next(
        (s for s in current_scenarios if s["id"] == requested_round),
        None
    )

    if scenario is None:
        return jsonify({"error": "Scenario not found"}), 404

    choice = next(
        (c for c in scenario["choices"] if c["id"] == choice_id),
        None
    )

    if choice is None:
        return jsonify({"error": "Invalid choice"}), 400

    # Save indicators before the decision
    
    before = game["indicators"].copy()

    # Save the original state for comparison
    old_game = deepcopy(game)

    # Calculate the selected policy
    play_choice(game, choice_id, current_scenarios)

    # Save only if the database state is unchanged
    try:
        update_game_if_unchanged(game_id, old_game, game)
    except ValueError:
        return jsonify({
            "error": "Game state changed. Please refresh."
        }), 409


    after = game["indicators"].copy()

    # Calculate actual changes
    changes = {
        name: after[name] - before[name]
        for name in before
    }

    return jsonify({
        "game_id": game_id,
        "decision": {
            "round": requested_round,
            "choice_id": choice_id,
            "text": choice["text"],
            "outcome": choice.get("outcome", {})
        },
        "base_effects": choice["effects"],
        "before": before,
        "after": after,
        "changes": changes,
        "game": game
    })

@app.route("/dashboard", methods=["GET"])
def dashboard_page():
    return render_template("dashboard.html")


@app.route("/api/game/<game_id>", methods=["GET"])
def get_game_state(game_id):
    game = load_game(game_id)

    if game is None:
        return jsonify({"error": "Game not found"}), 404

    current_scenario = None

    if game["status"] == "playing":
        current_scenarios = get_country_scenarios(
            game.get("country", "finland")
        )

        scenario = next(
            (s for s in current_scenarios if s["id"] == game["round"]),
            None
        )

        if scenario is not None:
            current_scenario = public_scenario(scenario)

    return jsonify({
        "game_id": game_id,
        "game": game,
        "scenario": current_scenario
    }), 200

@app.route("/decision", methods=["GET"])
def decision_page():
    return render_template("decision.html")

@app.route("/consequence", methods=["GET"])
def consequence_page():
    return render_template("consequence.html")

@app.route("/results", methods=["GET"])
def results_page():
    return render_template("results.html")

@app.route("/highscores", methods=["GET"])
def highscores_page():
    return render_template("highscores.html")

@app.route("/api/highscores", methods=["GET"])
def high_scores():
    country = request.args.get("country", "finland").strip().lower()
    difficulty = request.args.get("difficulty", "easy").strip().lower()

    if not country or len(country) > 40:
        return jsonify({"error": "Invalid country"}), 400

    if difficulty not in ("easy", "medium", "hard"):
        return jsonify({"error": "Invalid difficulty"}), 400

    scores = get_high_scores(country, difficulty, limit=10)

    return jsonify({
        "country": country,
        "difficulty": difficulty,
        "scores": scores
    }), 200

if __name__ == "__main__":
    app.run(debug=True)

