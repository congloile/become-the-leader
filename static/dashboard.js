const gameId = sessionStorage.getItem("game_id");

const indicatorNames = {
    ECO: "Economy",
    HAP: "Happiness",
    ENV: "Environment",
    SEC: "Security"
};

const difficultyRules = {
    easy: { limit: 10, secLimit: 20 },
    medium: { limit: 20, secLimit: 40 },
    hard: { limit: 30, secLimit: 50 }
};

function getPhase(round) {
    if (round <= 3) {
        return "Phase 1: Establish Your Government";
    }

    if (round <= 7) {
        return "Phase 2: Manage National Challenges";
    }

    return "Phase 3: Secure Your Legacy";
}

function renderIndicators(indicators, difficulty) {
    const container = document.getElementById(
        "indicators-container"
    );

    container.replaceChildren();

    const rules = difficultyRules[difficulty];

    for (const [code, label] of Object.entries(indicatorNames)) {
        const value = indicators[code];
        const limit = code === "SEC"
            ? rules.secLimit
            : rules.limit;

        const item = document.createElement("div");
        item.className = "indicator";

        const header = document.createElement("div");
        header.className = "indicator-header";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = `${label} (${code})`;

        const valueStrong = document.createElement("strong");
        valueStrong.textContent = value;

        header.append(nameSpan, valueStrong);

        const track = document.createElement("div");
        track.className = "indicator-track";
        track.setAttribute("role", "progressbar");
        track.setAttribute("aria-label", label);
        track.setAttribute("aria-valuemin", "0");
        track.setAttribute("aria-valuemax", "100");
        track.setAttribute("aria-valuenow", value);

        const fill = document.createElement("div");
        fill.className = "indicator-fill";
        fill.style.width = `${value}%`;

        const marker = document.createElement("div");
        marker.className = "indicator-limit";
        marker.style.left = `${limit}%`;

        track.append(fill, marker);
        item.append(header, track);
        container.appendChild(item);
    }
}

async function loadDashboard() {
    if (!gameId) {
        window.location.replace("/setup");
        return;
    }

    const message = document.getElementById(
        "dashboard-message"
    );

    try {
        const response = await fetch(
            `/api/game/${encodeURIComponent(gameId)}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Failed to load game"
            );
        }

        const game = result.game;
        const stats = game.indicators;
        const rules = difficultyRules[game.difficulty];

        document.getElementById("round-display").textContent =
            `Round ${game.round} / 10`;

        document.getElementById("phase-display").textContent =
            getPhase(game.round);

        document.getElementById("difficulty-display").textContent =
            game.difficulty.toUpperCase();

        document.getElementById("player-display").textContent =
            game.player_name;

        document.getElementById("eco-goal").textContent =
            `${stats.ECO} / 70`;

        document.getElementById("hap-goal").textContent =
            `${stats.HAP} / 80`;

        document.getElementById("env-goal").textContent =
            `${stats.ENV} / 75`;

        document.getElementById("limits-note").textContent =
            `Game Over if ECO/HAP/ENV ≤ ${rules.limit}, ` +
            `or Security ≤ ${rules.secLimit}.`;

        renderIndicators(stats, game.difficulty);

        document.getElementById("begin-button").textContent =
            `Begin Round ${game.round}`;
        
        document.getElementById("begin-button").disabled =
            game.status !== "playing";

        if (game.status === "playing") {
            message.textContent =
                "Your government is ready. " +
                "Decision screen will be connected next.";
        } else {
            message.textContent =
                `Game status: ${game.status}`;
        }

        console.log("Dashboard loaded:", result);

    } catch (error) {
        message.textContent = error.message;
    }
}

document.getElementById("menu-button")
    .addEventListener("click", () => {
        const confirmed = window.confirm(
            "Leave this game and return to Main Menu?"
        );

        if (confirmed) {
            sessionStorage.removeItem("game_id");
            window.location.href = "/";
        }
    });

document.getElementById("begin-button")
    .addEventListener("click", () => {
        window.location.href = "/decision";
    });

loadDashboard();
