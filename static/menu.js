document.addEventListener("DOMContentLoaded", () => {
    const newGameButton = document.getElementById("new-game");

    console.log("Menu JavaScript loaded!");

    if (newGameButton) {
        newGameButton.addEventListener("click", () => {
            window.location.href = "/setup";
        });
    } else {
        console.error("New Game button not found!");
    }

    // High Scores button
    const highScoresButton =
        document.getElementById("high-scores");

    if (highScoresButton) {
        highScoresButton.addEventListener("click", () => {
            window.location.href = "/highscores";
        });
    } else {
        console.error("High Scores button not found!");
    }

});
