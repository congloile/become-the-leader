// Address of the backend API
const API_URL = "http://127.0.0.1:5000/api";

async function sendRequest(endpoint, method = "GET", body = null) {
    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json" // Tells flask that we are sending JSON data
        }
    };
// Convert JS data into JSON before sending it.
    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(API_URL + endpoint, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong");
        }

        return data;

    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

async function startGame(playerName, country, difficulty) {
    return await sendRequest("/games", "POST", {
        player_name: playerName,
        country: country,
        difficulty: difficulty
    });
}

async function getGame(gameId) {
    return await sendRequest("/games/" + gameId);
}

async function getScenario(gameId) {
    return await sendRequest("/games/" + gameId + "/scenario");
}
//Sends the player's selected policy to Flask
async function submitDecision(gameId, choiceId) {
    return await sendRequest(
        "/games/" + gameId + "/decision",
        "POST",
        {
            choice_id: choiceId
        }
    );
}
// Requests leaderboard information for a selected difficulty
async function getLeaderboard(difficulty) {
    return await sendRequest("/leaderboard/" + difficulty);
}
