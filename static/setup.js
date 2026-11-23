const setupForm = document.getElementById("setup-form");
const playerName = document.getElementById("player-name");
const startButton = document.getElementById("start-button");
const backButton = document.getElementById("back-button");
const setupMessage = document.getElementById("setup-message");

const difficultyInputs = document.querySelectorAll(
    'input[name="difficulty"]'
);

// Enable Start Game only when setup is complete
function validateSetup() {
    const name = playerName.value.trim();

    const selectedDifficulty = document.querySelector(
        'input[name="difficulty"]:checked'
    );

    startButton.disabled = !name || !selectedDifficulty;
}

playerName.addEventListener("input", validateSetup);

difficultyInputs.forEach((input) => {
    input.addEventListener("change", validateSetup);
});

// Back to Main Menu
backButton.addEventListener("click", () => {
    window.location.href = "/";
});


// Start a new game through Flask API
setupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    validateSetup();

    if (startButton.disabled) {
        return;
    }

    const name = playerName.value.trim();

    const difficulty = document.querySelector(
        'input[name="difficulty"]:checked'
    ).value;

    startButton.disabled = true;
    setupMessage.textContent = "Creating game...";

    try {
        const response = await fetch("/api/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                country: "finland",
                difficulty: difficulty
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Could not start game"
            );
        }

        // Clear the previous game's decision
        sessionStorage.removeItem("last_decision");

        // Remember the new Game ID
        sessionStorage.setItem("game_id", result.game_id);

        console.log("Game created:", result);

        // Go to Game Decision page
        window.location.href = "/decision";


    } catch (error) {
        setupMessage.textContent = error.message;
        validateSetup();
    }
});

validateSetup();

