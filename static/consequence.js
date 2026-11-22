const gameId = sessionStorage.getItem("game_id");
const storedDecision = sessionStorage.getItem("last_decision");

const nextButton = document.getElementById("next-button");
const menuButton = document.getElementById("menu-button");

const indicatorNames = {
    ECO: "Economy",
    HAP: "Happiness",
    ENV: "Environment",
    SEC: "Security"
};

const difficultyRules = {
    easy: { limit: 10, secLimit: 20, multiplier: 0.60 },
    medium: { limit: 20, secLimit: 40, multiplier: 0.80 },
    hard: { limit: 30, secLimit: 50, multiplier: 1.10 }
};

function formatChange(value) {
    return value > 0 ? `+${value}` : String(value);
}

function showConsequence(result) {
    const game = result.game;
    const rules = difficultyRules[game.difficulty];

    const before = result.before;
    const after = result.after;
    const changes = result.changes;
    const baseEffects = result.base_effects || {};

    document.getElementById("round-display").textContent =
        `Round ${result.decision.round} / 10 | ` +
        `Finland | ${game.difficulty.toUpperCase()}`;

    document.getElementById("decision-title").textContent =
        `You chose: ${result.decision.choice_id}. ` +
        result.decision.text;

    document.getElementById("difficulty-note").textContent =
        `${game.difficulty.toUpperCase()}: ` +
        `negative effects ×${rules.multiplier.toFixed(2)}, ` +
        "positive effects unchanged.";

    const tableBody = document.getElementById("impact-body");
    tableBody.replaceChildren();

    for (const code of ["ECO", "HAP", "ENV", "SEC"]) {
        const row = document.createElement("tr");

        const values = [
            indicatorNames[code],
            before[code],
            baseEffects[code] === undefined
                ? "—"
                : formatChange(baseEffects[code]),
            formatChange(changes[code]),
            after[code]
        ];

        values.forEach((value, index) => {
            const cell = document.createElement("td");
            cell.textContent = value;

            if (index === 3) {
                if (changes[code] > 0) {
                    cell.className = "positive";
                } else if (changes[code] < 0) {
                    cell.className = "negative";
                }
            }

            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    }

    showWarnings(after, rules);

    const message = document.getElementById("game-message");

    if (game.status === "playing") {
        message.textContent =
            `Round ${result.decision.round} completed. ` +
            `Your government moves to Round ${game.round}.`;

        nextButton.textContent = `Next Round ${game.round}`;
        nextButton.disabled = false;

        nextButton.addEventListener("click", () => {
            sessionStorage.removeItem("last_decision");
            window.location.href = "/decision";
        });
    } else {
        if (game.status === "victory") {
            const score = Object.values(after)
                .reduce((sum, value) => sum + value, 0);

            message.textContent =
                `VICTORY! Final score: ${score}`;
        } else {
            message.textContent =
                `GAME OVER — ${game.status === "defeat"
                    ? "Victory goals not met."
                    : "An indicator reached its limit."}`;
        }

        nextButton.textContent = "See Results";
        nextButton.disabled = false;

        // Open final Victory / Game Over screen
        nextButton.addEventListener("click", () => {
            window.location.href = "/results";
});
    }
}

function showWarnings(indicators, rules) {
    const warnings = [];

    for (const [code, value] of Object.entries(indicators)) {
        const limit = code === "SEC"
            ? rules.secLimit
            : rules.limit;

        if (value <= limit) {
            warnings.push(
                `${indicatorNames[code]} reached the Game Over limit: ` +
                `${value} (limit ${limit}).`
            );
        } else if (value <= limit + 10) {
            warnings.push(
                `${indicatorNames[code]} is close to its limit: ` +
                `${value} (limit ${limit}).`
            );
        }
    }

    const panel = document.getElementById("warning-panel");

    if (warnings.length > 0) {
        panel.hidden = false;

        document.getElementById("warning-message").textContent =
            warnings.join(" ");
    } else {
        panel.hidden = true;
    }
}

menuButton.addEventListener("click", () => {
    if (window.confirm("Return to Main Menu?")) {
        sessionStorage.removeItem("game_id");
        sessionStorage.removeItem("last_decision");

        window.location.href = "/";
    }
});

if (!gameId) {
    window.location.replace("/setup");
} else {
    let result = null;

    try {
        result = JSON.parse(storedDecision);
    } catch (error) {
        console.error("Cannot read decision result:", error);
    }

    if (!result || result.game_id !== gameId) {
        window.location.replace("/dashboard");
    } else {
        showConsequence(result);
    }
}
