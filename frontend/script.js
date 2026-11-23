
let currentGame = null;
let gameId = null;
let currentScenario = null;
let isSubmitting = false;

const playerNameInput = document.getElementById("playerName");
const countrySelect = document.getElementById("countrySelection");
const difficultySelect = document.getElementById("difficultySelection");
const startButton = document.getElementById("startGameBtn");

const ecoValue = document.getElementById("ecoValue");
const hapValue = document.getElementById("hapValue");
const envValue = document.getElementById("envValue");
const secValue = document.getElementById("secValue");
const roundValue = document.getElementById("roundValue");

const scenarioTitle = document.getElementById("scenarioTitle");
const choicesContainer = document.getElementById("choicesContainer");

const consequenceText = document.getElementById("consequenceText");
const nextRoundButton = document.getElementById("nextRoundBtn");

const leaderboardDifficulty = document.getElementById("leaderboardDifficulty");
const leaderboardContainer = document.getElementById("leaderboardContainer");

const errorMessage = document.getElementById("errorMessage");

function showScreen(screenId) {
    const screens = [
        "setupScreen",
        "gameScreen",
        "consequenceScreen",
        "resultScreen",
        "leaderboardScreen"
    ];

    screens.forEach(function(id) {
        const screen = document.getElementById(id);

        if (screen) {
            screen.hidden = true;
        }
    });
// Finds the screen we want to display.
    const selectedScreen = document.getElementById(screenId);

    if (selectedScreen) {
        selectedScreen.hidden = false;
    }
}

function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.hidden = false;
    }

    console.error(message);
}

function clearError() {
    if (errorMessage) {
        errorMessage.textContent = "";
        errorMessage.hidden = true;
    }
}
// Updates the dashboard with the latest game information
function updateDashboard(game) {
    currentGame = game;

    const indicators = game.indicators;
// Displays updated indicator values.
    ecoValue.textContent = indicators.ECO;
    hapValue.textContent = indicators.HAP;
    envValue.textContent = indicators.ENV;
    secValue.textContent = indicators.SEC;

    roundValue.textContent = game.round; 
}
// Starts a new game when the player clicks Start
async function handleStartGame() {
    clearError();

    const playerName = playerNameInput.value.trim();
    const country = countrySelect.value;
    const difficulty = difficultySelect.value;

    if (playerName === "") {
        showError("Please enter your name.");
        return;
    }

    startButton.disabled = true;

    try {
        const data = await startGame(
            playerName,
            country,
            difficulty
        );

        gameId = data.game_id;
        currentGame = data.game;

        updateDashboard(currentGame);

        await loadCurrentScenario();

    } catch (error) {
        showError("Could not start the game: " + error.message);

    } finally {
        startButton.disabled = false;
    }
}

async function loadCurrentScenario() {
    clearError();

    try {
        const data = await getScenario(gameId);

        currentScenario = data.scenario;

        scenarioTitle.textContent = currentScenario.title;

        displayChoices(currentScenario.choices);

        updateDashboard(currentGame);

        showScreen("gameScreen");

    } catch (error) {
        showError("Could not load scenario: " + error.message);
    }
}

function displayChoices(choices) {
    choicesContainer.innerHTML = "";

    choices.forEach(function(choice) {
        const button = document.createElement("button"); 

        button.textContent = choice.text;
        button.type = "button";

        button.addEventListener("click", function() {
            handleChoice(choice.id);
        });
    // Adds the button to the choices container
        choicesContainer.appendChild(button);
    });
}

async function handleChoice(choiceId) {
    if (isSubmitting) {
        return;
    }

    clearError();

    isSubmitting = true;
    // Disables all choice buttons while waiting for Flask
    const buttons = choicesContainer.querySelectorAll("button");

    buttons.forEach(function(button) {
        button.disabled = true;
    });

    try {
        const data = await submitDecision(gameId, choiceId);

        currentGame = data.game;

        updateDashboard(currentGame);

        displayConsequences(choiceId);

    } catch (error) {
        showError("Could not submit decision: " + error.message);
        // Re-enables buttons if the request fails
        buttons.forEach(function(button) {
            button.disabled = false;
        });

    } finally {
        isSubmitting = false;
    }
}
// Displays the consequences after a policy has been selected
function displayConsequences(choiceId) {
    const selectedChoice = currentScenario.choices.find(
        function(choice) {
            return choice.id === choiceId;
        }
    );

    if (selectedChoice) {
        consequenceText.textContent =
            "You selected: " + selectedChoice.text;
    }

    if (currentGame.status !== "playing") {
        nextRoundButton.hidden = true;
        showGameResult();

    } else {
        nextRoundButton.hidden = false;
        showScreen("consequenceScreen");
    }
}
// Displays the correct ending depending on the game status
function showGameResult() {
    const resultTitle = document.getElementById("resultTitle");
    const resultMessage = document.getElementById("resultMessage");

    if (currentGame.status === "victory") {
        resultTitle.textContent = "Victory!";
        resultMessage.textContent =
            "Congratulations! You achieved your country's goals.";

    } else if (currentGame.status === "defeat") {
        resultTitle.textContent = "Defeat";
        resultMessage.textContent =
            "You completed all 10 rounds, but did not meet all the goals.";

    } else if (currentGame.status === "game_over") {
        resultTitle.textContent = "Game Over";
        resultMessage.textContent =
            "One of your indicators reached its critical limit.";
    }

    showScreen("resultScreen");
}
// Loads the next scenario when the player clicks Continue
async function handleNextRound() {
    if (!currentGame || currentGame.status !== "playing") {
        return;
    }

    await loadCurrentScenario();
}

async function handleLeaderboard() {
    clearError();

    const difficulty = leaderboardDifficulty.value;

    try {
         // Requests leaderboard information from Flask
        const data = await getLeaderboard(difficulty);

        leaderboardContainer.innerHTML = "";

        data.entries.forEach(function(entry, index) {
            const row = document.createElement("p");
            // Displays ranking, player name and score
            row.textContent =
                (index + 1) + ". " +
                entry.player_name + " - " +
                entry.score;

            leaderboardContainer.appendChild(row);
        });

        showScreen("leaderboardScreen");

    } catch (error) {
        showError("Could not load leaderboard: " + error.message);
    }
}

startButton.addEventListener("click", handleStartGame);

nextRoundButton.addEventListener("click", handleNextRound);

showScreen("setupScreen");
