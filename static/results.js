const gameId = sessionStorage.getItem("game_id");

const indicatorNames = {
    ECO: "Economy",
    HAP: "Happiness",
    ENV: "Environment",
    SEC: "Security"
};

const goals = {
    ECO: 70,
    HAP: 80,
    ENV: 75
};

const limits = {
    easy: { normal: 10, security: 20 },
    medium: { normal: 20, security: 40 },
    hard: { normal: 30, security: 50 }
};

function addRow(container, label, value, className = "") {
    const row = document.createElement("div");
    row.className = "result-row";

    const name = document.createElement("span");
    name.textContent = label;

    const result = document.createElement("strong");
    result.textContent = value;
    result.className = className;

    row.append(name, result);
    container.appendChild(row);
}

async function loadResults() {
    if (!gameId) {
        window.location.replace("/setup");
        return;
    }

    try {
        const response = await fetch(
            `/api/game/${encodeURIComponent(gameId)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Cannot load results");
        }

        const game = data.game;
        const stats = game.indicators;

        if (game.status === "playing") {
            window.location.replace("/dashboard");
            return;
        }

        const indicatorsContainer =
            document.getElementById("final-indicators");

        const goalsContainer =
            document.getElementById("final-goals");

        for (const [code, name] of Object.entries(indicatorNames)) {
            addRow(indicatorsContainer, `${name} (${code})`, stats[code]);
        }

        for (const [code, target] of Object.entries(goals)) {
            const met = stats[code] >= target;

            addRow(
                goalsContainer,
                `${indicatorNames[code]} ≥ ${target}`,
                `${stats[code]} — ${met ? "MET" : "MISSED"}`,
                met ? "goal-met" : "goal-missed"
            );
        }


 // Security is a survival requirement, not a victory goal
const securityLimit = limits[game.difficulty].security;
const securitySafe = stats.SEC > securityLimit;

const securityHeading = document.createElement("h3");
securityHeading.className = "security-requirement-title";
securityHeading.textContent = "Security Requirement";
goalsContainer.appendChild(securityHeading);

addRow(
    goalsContainer,
    `Security > ${securityLimit} (${game.difficulty.toUpperCase()})`,
    `${stats.SEC} — ${securitySafe ? "SAFE" : "LIMIT REACHED"}`,
    securitySafe ? "goal-met" : "goal-missed"
);


        const title = document.getElementById("result-title");
        const description =
            document.getElementById("result-description");
        const reason = document.getElementById("result-reason");

        if (game.status === "victory") {
            title.textContent = "VICTORY!";

            description.textContent = "";

            const score = Object.values(stats)
                .reduce((total, value) => total + value, 0);

            document.getElementById("score-panel").hidden = false;
            document.getElementById("final-score").textContent =
                score;

            reason.textContent =
                "Congratulations! All three victory goals were met.";

        } else if (game.status === "game_over") {
            title.textContent = "GAME OVER";

            description.textContent =
                `Your government fell in Round ${game.round}.`;

            const rule = limits[game.difficulty];

            const failed = Object.entries(stats)
                .filter(([code, value]) => {
                    const limit = code === "SEC"
                        ? rule.security
                        : rule.normal;

                    return value <= limit;
                })
                .map(([code, value]) =>
                    `${indicatorNames[code]}: ${value}`
                );

            reason.textContent =
                "An indicator reached its Game Over limit. " +
                failed.join(", ");

        } else if (game.status === "defeat") {
            title.textContent = "GAME OVER";

            description.textContent =
                "You survived all 10 rounds, but did not " +
                "meet all Finland victory goals.";

            const missed = Object.entries(goals)
                .filter(([code, target]) => stats[code] < target)
                .map(([code, target]) =>
                    `${indicatorNames[code]} is ${target - stats[code]} short`
                );

            reason.textContent = missed.join(". ") + ".";
        } else {
            throw new Error("Unknown game status");
        }

    } catch (error) {
        document.getElementById("result-error").textContent =
            error.message;
    }
}

document.getElementById("retry-button")
    .addEventListener("click", () => {
        sessionStorage.removeItem("game_id");
        sessionStorage.removeItem("last_decision");
        window.location.href = "/setup";
    });

document.getElementById("menu-button")
    .addEventListener("click", () => {
        sessionStorage.removeItem("game_id");
        sessionStorage.removeItem("last_decision");
        window.location.href = "/";
    });

loadResults();
