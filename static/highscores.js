/* ========================================
   BECOME THE LEADER — HIGH SCORES
   ======================================== */

const countrySelect = document.getElementById("country-select");
const difficultySelect = document.getElementById("difficulty-select");
const scoresBody = document.getElementById("scores-body");
const scoresMessage = document.getElementById("scores-message");
const menuButton = document.getElementById("menu-button");


// Create one leaderboard row
function addScoreRow(player) {
    const row = document.createElement("tr");

    const rankCell = document.createElement("td");
    rankCell.textContent = player.rank;

    const nameCell = document.createElement("td");
    nameCell.textContent = player.player_name;

    const scoreCell = document.createElement("td");
    scoreCell.textContent = player.score;

    row.appendChild(rankCell);
    row.appendChild(nameCell);
    row.appendChild(scoreCell);

    scoresBody.appendChild(row);
}


// Load high scores from Flask API
async function loadHighScores() {
    const country = countrySelect.value;
    const difficulty = difficultySelect.value;

    scoresBody.replaceChildren();
    scoresMessage.textContent = "Loading high scores...";

    try {
        const params = new URLSearchParams({
            country: country,
            difficulty: difficulty
        });

        const response = await fetch(
            `/api/highscores?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error("Failed to load high scores.");
        }

        const data = await response.json();

        // Ignore an outdated response if filters changed
        if (
            country !== countrySelect.value ||
            difficulty !== difficultySelect.value
        ) {
            return;
        }

        if (!Array.isArray(data.scores)) {
            throw new Error("Invalid high scores data.");
        }

        if (data.scores.length === 0) {
            scoresMessage.textContent =
                "No victories recorded for this difficulty yet.";
            return;
        }

        for (const player of data.scores) {
            addScoreRow(player);
        }

        scoresMessage.textContent = "";

    } catch (error) {
        scoresMessage.textContent = error.message;
    }
}


// Update leaderboard when filters change
countrySelect.addEventListener("change", loadHighScores);
difficultySelect.addEventListener("change", loadHighScores);


// Return to Main Menu
menuButton.addEventListener("click", () => {
    window.location.href = "/";
});


// Load leaderboard when page opens
loadHighScores();
