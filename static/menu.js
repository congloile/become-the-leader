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
});
