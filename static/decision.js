const gameId = sessionStorage.getItem("game_id");

const message = document.getElementById("decision-message");
const choicesContainer = document.getElementById("choices-container");

const difficultyRules = {
    easy: { limit: 10, secLimit: 20 },
    medium: { limit: 20, secLimit: 40 },
    hard: { limit: 30, secLimit: 50 }
};

let currentRound = null;
let decisionSubmitted = false;
let selectedChoiceId = null;
let selectedButton = null;

function getPhase(round) {
    if (round <= 3) {
        return "Phase 1: Establish Your Government";
    }

    if (round <= 7) {
        return "Phase 2: Manage National Challenges";
    }

    return "Phase 3: Secure Your Legacy";
}

function renderIndicators(game) {
    const container = document.getElementById(
        "mini-indicators"
    );

    container.replaceChildren();

    const rules = difficultyRules[game.difficulty];

    for (const [code, value] of Object.entries(
        game.indicators
    )) {
        const limit = code === "SEC"
            ? rules.secLimit
            : rules.limit;

        const item = document.createElement("div");
        item.className = "mini-indicator";

        const header = document.createElement("div");
        header.className = "mini-indicator-header";
        header.textContent = `${code}: ${value}`;

        const track = document.createElement("div");
        track.className = "mini-track";

        const fill = document.createElement("div");
        fill.className = "mini-fill";
        fill.style.width = `${value}%`;

        const marker = document.createElement("div");
        marker.className = "mini-limit";
        marker.style.left = `${limit}%`;

        track.append(fill, marker);
        item.append(header, track);
        container.appendChild(item);
    }
}

function disableChoices() {
    document.querySelectorAll(".policy-button")
        .forEach((button) => {
            button.disabled = true;
        });
}

async function submitChoice(choiceId, button) {
    if (decisionSubmitted || currentRound === null) {
        return;
    }

    decisionSubmitted = true;
    disableChoices();

    button.classList.add("selected");
    message.textContent = "Processing your decision...";

    try {
        const response = await fetch("/api/choice", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                game_id: gameId,
                round: currentRound,
                choice_id: choiceId
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Could not process decision"
            );
        }

        // Keep the result for the Consequence Screen
        sessionStorage.setItem(
            "last_decision",
            JSON.stringify(result)
        );

        console.log("Decision result:", result);

        // Navigate to Consequence Screen
        window.location.href = "/consequence";

    } catch (error) {
        message.textContent = error.message;

        // Allow another attempt if the request failed.
        // Refresh state first if the round has changed.
        decisionSubmitted = false;

        if (
            error.message.includes("Wrong round") ||
            error.message.includes("changed") ||
            error.message.includes("ended")
        ) {
            message.textContent +=
                " Return to Dashboard to refresh.";
        } else {
            // Reload to avoid submitting twice if a response
            // was lost after the server processed the choice.
            message.textContent +=
                " Refresh the page to check the game state.";
        }
    }
}


function renderChoices(choices) {
    choicesContainer.replaceChildren();

    selectedChoiceId = null;
    selectedButton = null;

    for (const choice of choices) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "policy-button";
        button.textContent = `${choice.id}. ${choice.text}`;

        button.addEventListener("click", () => {
            if (decisionSubmitted) {
                return;
            }

            // Remove highlight from previous selection
            document.querySelectorAll(".policy-button")
                .forEach((item) => {
                    item.classList.remove("selected");
                });

            // Highlight the selected policy
            button.classList.add("selected");

            // Remember the selection
            selectedChoiceId = choice.id;
            selectedButton = button;

            message.textContent =
                `Selected: ${choice.id}. ${choice.text}`;
        });

        choicesContainer.appendChild(button);
    }
}


async function loadDecision() {
    if (!gameId) {
        window.location.replace("/setup");
        return;
    }

    try {
        const response = await fetch(
            `/api/game/${encodeURIComponent(gameId)}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Cannot load game");
        }

        const game = result.game;

        if (game.status !== "playing") {
            window.location.replace("/results");
            return;
        }

        const scenario = result.scenario;

        if (!scenario) {
            throw new Error("Scenario not available");
        }

        currentRound = game.round;

        document.getElementById("round-display")
            .textContent = `Round ${game.round} / 10`;

        document.getElementById("difficulty-display")
            .textContent = game.difficulty.toUpperCase();

        document.getElementById("phase-display")
            .textContent = getPhase(game.round);

        document.getElementById("scenario-title")
            .textContent = scenario.title;

        document.getElementById("scenario-description")
            .textContent = scenario.description ||
            "Choose the policy you believe is best for your country.";

        renderIndicators(game);

        // Display current progress towards victory goals
        document.getElementById("goal-eco").textContent =
            `${game.indicators.ECO} / 70`;

        document.getElementById("goal-hap").textContent =
            `${game.indicators.HAP} / 80`;

        document.getElementById("goal-env").textContent =
            `${game.indicators.ENV} / 75`;

        const rules = difficultyRules[game.difficulty];

        document.getElementById("goal-limits").textContent =
            `Game Over: ECO/HAP/ENV ≤ ${rules.limit}; ` +
            `Security ≤ ${rules.secLimit}.`;

        renderChoices(scenario.choices);

        console.log("Scenario loaded:", scenario);

    } catch (error) {
        message.textContent = error.message;
    }
}

document.getElementById("menu-button")
    .addEventListener("click", () => {
        if (window.confirm("Return to Main Menu?")) {
            sessionStorage.removeItem("game_id");
            sessionStorage.removeItem("last_decision");
            window.location.href = "/";
        }
    });

loadDecision();
