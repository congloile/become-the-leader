const setupForm = document.getElementById("setup-form");
const playerName = document.getElementById("player-name");
const startButton = document.getElementById("start-button");
const backButton = document.getElementById("back-button");
const setupMessage = document.getElementById("setup-message");

const difficultyInputs = document.querySelectorAll(
    'input[name="difficulty"]'
);

// Country cards must have data-country="finland" or data-country="newzealand".
// Singapore remains unavailable until its scenarios are ready.
const countryCards = document.querySelectorAll(
    ".country-card[data-country]:not(.unavailable)"
);

const countryDetails = {
    finland: {
        label: "Finland",
        initial: { ECO: 65, HAP: 70, ENV: 70, SEC: 60 },
        goals: { ECO: 70, HAP: 80, ENV: 75 }
    },
    newzealand: {
        label: "New Zealand",
        initial: { ECO: 62, HAP: 65, ENV: 60, SEC: 75 },
        goals: { ECO: 70, HAP: 78, ENV: 78 }
    }
};

let selectedCountry = "finland";

function selectCountry(country) {
    const details = countryDetails[country];
    if (!details) return;

    selectedCountry = country;

    countryCards.forEach((card) => {
        const isSelected = card.dataset.country === country;
        card.classList.toggle("selected", isSelected);
        card.setAttribute("aria-pressed", String(isSelected));
    });

    const goalsBox = document.querySelector(".goals-box");
    if (goalsBox) {
        const title = goalsBox.querySelector("h3");
        const goals = goalsBox.querySelectorAll("p");
        const startingStats = goalsBox.querySelector("small");

        if (title) title.textContent = `${details.label} - Victory Goals`;
        if (goals[0]) goals[0].textContent = `Economy (ECO) ≥ ${details.goals.ECO}`;
        if (goals[1]) goals[1].textContent = `Happiness (HAP) ≥ ${details.goals.HAP}`;
        if (goals[2]) goals[2].textContent = `Environment (ENV) ≥ ${details.goals.ENV}`;
        if (startingStats) {
            const s = details.initial;
            startingStats.textContent = `Starting indicators: ECO ${s.ECO} | HAP ${s.HAP} | ENV ${s.ENV} | SEC ${s.SEC}`;
        }
    }

    validateSetup();
}

countryCards.forEach((card) => {
    // The current HTML uses divs; make the available cards keyboard-accessible.
    card.setAttribute("role", "button");
    card.tabIndex = 0;
    card.addEventListener("click", () => selectCountry(card.dataset.country));
    card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectCountry(card.dataset.country);
        }
    });
});

// Enable Start Game only when setup is complete
function validateSetup() {
    const name = playerName.value.trim();

    const selectedDifficulty = document.querySelector(
        'input[name="difficulty"]:checked'
    );

    startButton.disabled = !name || !selectedDifficulty || !selectedCountry;
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
                country: selectedCountry,
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

selectCountry("finland");
