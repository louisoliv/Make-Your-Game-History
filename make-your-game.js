let storyMode = false; //Check if the story mode is involved
let isOverlayVisible = false; // Track overlay visibility

// AddEventListener on the "new game" button in the menu to start a game
// It displays the game div and hide the others
document.getElementById("new-game-btn").addEventListener("click", function () {
  document.getElementById("menu").style.display = "none";
  document.getElementById("parameters-btn").style.display = "none";
  document.getElementById("game").style.display = "flex";
  // Launch the game without the elements and levels from the stoty mode
  storyMode = false;
  // audioClick.pause();
  // Launch the game with the first level
  startGame(0);
});

// AddEventListener to get the settings options from the menu
// It displays the settings div and hide the others
document
  .getElementById("parameters-btn")
  .addEventListener("click", function () {
    document.getElementById("menu").style.display = "none";
    document.getElementById("game").style.display = "none";
    document.getElementById("parameters-section").style.display = "flex";

    // AddEventListener to return to the menu from the settings
    document.getElementById("go-back").addEventListener("click", () => {
      document.getElementById("menu").style.display = "flex";
      document.getElementById("parameters-section").style.display = "none";
    });
  });

// AddEventListener to enter in the story mode
// It displays the first story div to give the context to the player
document.getElementById("story-mode").addEventListener("click", function () {
  document.getElementById("story1").style.display = "flex";
  document.getElementById("menu").style.display = "none";
  document.getElementById("parameters-btn").style.display = "none";
  // audioClick.pause();

  // AddEventListener to start the first level of the game
  document.getElementById("play").addEventListener("click", function () {
    document.getElementById("story1").style.display = "none";
    document.getElementById("menu").style.display = "none";
    document.getElementById("parameters-btn").style.display = "none";
    document.getElementById("game").style.display = "flex";
    console.log("play");
    // Make sure that the player is playing to the story mode
    storyMode = true;
    // Call the main function with the first level
    startGame(0);
  });
});

let results = 0;

/**
 * Function that launch the game
 *
 * It has a lot of varaibles and intern functions
 */
function startGame(level) {
  // We reset the chrono at the beginning of this function
  resetChrono();
  startChrono(); // Start the chronometer

  // Variables set
  let grid = document.querySelector(".grid");
  let fpsElement = document.getElementById("fps");
  let resultDisplay = document.querySelector(".results");
  let currentShooterIndex = 538;
  let width = 25;
  let aliensRemoved = [];
  var invadersId;
  let isGoingRight = true;
  let direction = 1;
  let cooldownTime = 500; // The cooldown between 2 shots from the player
  let canShoot = true;
  let lastTime = 0;
  let delay = 250; // The "speed" of the alien ships
  let animationFrameId = null; // To store the animation frame request
  let gameOver = false; // Flag to track game over state
  let alienShootIntervalId = null;
  let playerLives = 3;

  const squares = [];

  //Empty the grid
  grid.innerHTML = "";

  // Create the grid
  for (let i = 0; i < width * width; i++) {
    const square = document.createElement("div");
    squares.push(square);
    grid.appendChild(square);
  }

  let gamePaused = false;

  // This const contains the different levels
  // The int in it are the position of alien shops
  const maps = [
    [6, 7, 8, 9],
    [
      6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 31, 32, 33, 34, 35, 36, 37,
      38, 39, 40, 41, 42,
    ],
    [
      6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 31, 32, 33, 34, 35, 36, 37,
      38, 39, 40, 41, 42, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67,
    ],
  ];

  // Initializing a variable at the index of the array of array
  // It will be easier to manipulate it
  let alienInvaders = maps[level];

  document.removeEventListener("keydown", handlePause);
  document.addEventListener("keydown", handlePause);

  // Add the necessary event listeners for each level transition
  document.getElementById("level2").onclick = function () {
    document.getElementById("story2").style.display = "none";
    document.getElementById("menu").style.display = "none";
    document.getElementById("parameters-btn").style.display = "none";
    document.getElementById("game").style.display = "flex";
    // endGame()
    startGame(1);
  };

  document.getElementById("level3").onclick = function () {
    document.getElementById("story3").style.display = "none";
    document.getElementById("menu").style.display = "none";
    document.getElementById("parameters-btn").style.display = "none";
    document.getElementById("game").style.display = "flex";
    startGame(2);
  };

  // Get the first and the last position of alien ships
  let firstAlien = alienInvaders[0];
  let lastAlien = alienInvaders[alienInvaders.length - 1];

  /**
   * Function updating the rightmost alien ship in the array.
   *
   * It allows the good condition for the collision
   */
  function updateAlienBounds() {
    if (alienInvaders.length === 0) return; // No aliens left

    // Find the rightmost element in each row
    let maxRightIndex = -1;
    alienInvaders.forEach((element) => {
      let colIndex = element % width;
      if (colIndex > maxRightIndex) {
        maxRightIndex = colIndex;
        lastAlien = element;
      }
    });

    // Find the leftmost element
    firstAlien = Math.min(...alienInvaders);
  }

  /**
   * Function that displays the alien ships
   */
  function draw() {
    for (let i = 0; i < alienInvaders.length; i++) {
      if (!aliensRemoved.includes(i)) {
        squares[alienInvaders[i]].classList.add("invader");
      }
    }
  }

  squares[currentShooterIndex].classList.add("shooter");

  /**
   * Function that removes the alien ships
   */
  function remove() {
    for (let i = 0; i < alienInvaders.length; i++) {
      squares[alienInvaders[i]].className = "";
    }
  }
  /**
   * Function allowing the player to move
   */
  function moveShooter(e) {
    if (gameOver || gamePaused) return; // Prevent movement if game is over or paused
    squares[currentShooterIndex].classList.remove("shooter");
    switch (e.key) {
      case "ArrowLeft":
        if (currentShooterIndex % width !== 0) currentShooterIndex -= 1;
        break;
      case "ArrowRight":
        if (currentShooterIndex % width < width - 1) currentShooterIndex += 1;
        break;
    }
    squares[currentShooterIndex].classList.add("shooter");
  }

  document.addEventListener("keydown", moveShooter);

  /**
   * Function allowing the alien ships to move
   */
  function moveInvaders(timestamp) {
    if (gamePaused || gameOver) return; // Pause the game if the state is paused or game over

    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    animationFrameId = requestAnimationFrame(moveInvaders); // Store the animation frame request

    if (elapsed > delay) {
      remove();

      updateAlienBounds(); // Update the bounds before checking edges
      const leftEdge = firstAlien % width === 0;
      const rightEdge = lastAlien % width === width - 1;
      remove();

      // condition for the collision to the right and the left
      if (rightEdge && isGoingRight) {
        for (let i = 0; i < alienInvaders.length; i++) {
          alienInvaders[i] += width + 1;
        }
        direction = -1;
        isGoingRight = false;
      }

      if (leftEdge && !isGoingRight) {
        for (let i = 0; i < alienInvaders.length; i++) {
          alienInvaders[i] += width - 1;
        }
        direction = 1;
        isGoingRight = true;
      }

      updateAlienBounds(); // Update the bounds before checking edges
      for (let i = 0; i < alienInvaders.length; i++) {
        alienInvaders[i] += direction;
      }

      draw();

      // Condition for the game over statement
      // Checking if the index of the player has the class "ivader"
      if (squares[currentShooterIndex].classList.contains("invader")) {
        resultDisplay.innerHTML = "GAME OVER";

        squares[currentShooterIndex].classList.remove("shooter");
        document.removeEventListener("keydown", moveShooter);
        document.removeEventListener("keydown", shoot); // Remove shooting event listener
        gameOver = true; // Set game over flag
        endGame();
        for (let i = 0; i < alienInvaders.length; i++) {
          squares[alienInvaders[i]].classList.remove("invader");
        }

        canShoot = false;
        cancelAnimationFrame(animationFrameId); // Cancel the animation frame
      }

      // Condition for the win statement
      // Checking all alien ships have been destroyed
      if (aliensRemoved.length === alienInvaders.length) {
        resultDisplay.innerHTML = `Score : ${results}`;
        stopChrono();
        squares[currentShooterIndex].classList.remove("shooter");
        document.removeEventListener("keydown", moveShooter);
        document.removeEventListener("keydown", shoot); // Remove shooting event listener
        gameOver = true; // Set game over flag
        endGame();
        for (let i = 0; i < alienInvaders.length; i++) {
          squares[alienInvaders[i]].classList.remove("invader");
        }
        cancelAnimationFrame(animationFrameId); // Cancel the animation frame
      }
      lastTime = timestamp;
    }
  }

  animationFrameId = requestAnimationFrame(moveInvaders);

  /**
   * Function managing the shoot from player
   */
  function shoot(e) {
    if (gamePaused || e.key !== "ArrowUp" || !canShoot || gameOver) return; // Prevent shooting if game is paused or game over
    if (e.key === "ArrowUp" && canShoot && !gameOver) {
      canShoot = false;
      let laserId;
      let currentLaserIndex = currentShooterIndex;

      function moveLaser() {
        if (currentLaserIndex >= 0 && currentLaserIndex < width * width) {
          squares[currentLaserIndex].classList.remove("laser");
        }

        currentLaserIndex -= width;

        if (currentLaserIndex < 0) {
          clearInterval(laserId);
          return;
        }

        if (
          currentLaserIndex < width * width &&
          squares[currentLaserIndex].classList.contains("invader")
        ) {
          squares[currentLaserIndex].classList.remove("laser");
          squares[currentLaserIndex].classList.remove("invader");
          squares[currentLaserIndex].classList.add("boom");

          setTimeout(
            () => squares[currentLaserIndex].classList.remove("boom"),
            300
          );
          clearInterval(laserId);

          const alienIndex = alienInvaders.indexOf(currentLaserIndex);
          if (alienIndex !== -1) {
            alienInvaders.splice(alienIndex, 1);
          }

          results++;
          resultDisplay.innerHTML = "Score : " + results;
          updateAlienBounds();
          return;
        }

        if (currentLaserIndex >= 0 && currentLaserIndex < width * width) {
          squares[currentLaserIndex].classList.add("laser");
        }
      }

      if (level === 1) {
        laserId = setInterval(moveLaser, 30);
      } else if (level === 2) {
        laserId = setInterval(moveLaser, 15);
      } else {
        laserId = setInterval(moveLaser, 50);
      }

      setTimeout(() => {
        canShoot = true;
      }, cooldownTime);
    }
  }

  document.addEventListener("keydown", shoot);

  /**
   * Function handling player lives
   */
  function loseLife() {
    if (playerLives > 0) {
      playerLives--; // déduire une vie
    }
    document.getElementById(
      "playerLives"
    ).innerText = `Vies restantes : ${playerLives}`;
    if (playerLives <= 0) {
      gameOver = true; // terminer le jeu si le joueur n'a plus de vies
      endGame();
    }
  }

  /**
   * Function managing the shoot from qlien ships
   */
  function alienShoot() {
    if (gamePaused || gameOver || alienInvaders.length === 0) return; // Prevent shooting if game is paused or game over
    if (alienInvaders.length > 0) {
      let shooter =
        alienInvaders[Math.floor(Math.random() * alienInvaders.length)]; // Choose randomly an alien ship to shoot
      let laserAlienId;
      let currentLaserIndex = shooter;

      function moveLaser() {
        if (gamePaused) return;
        squares[currentLaserIndex].classList.remove("laser");
        currentLaserIndex += width;
        if (currentLaserIndex >= squares.length) {
          // If the laser go outside the grid
          clearInterval(laserAlienId);
          laserAlienId = null;
          return;
        }
        if (squares[currentLaserIndex].classList.contains("shooter")) {
          // If the laser hit the player / shooter
          squares[currentLaserIndex].classList.remove("laser");
          squares[currentLaserIndex].classList.add("boom");
          setTimeout(
            () => squares[currentLaserIndex].classList.remove("boom"),
            300
          );
          clearInterval(laserAlienId);
          loseLife();
          return;
        }
        squares[currentLaserIndex].classList.add("laser");
      }
      laserAlienId = setInterval(moveLaser, 50);
    }
  }
  // Alien ships can shoot every 2 seconds
  alienInvadersId = setInterval(alienShoot, 2000);

  // Toggle pause functionality

  /**
   * Function handling the menu with "continue" and "restart"
   */
  function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
      if (!isOverlayVisible) {
        showPopup();
      }
      stopChrono();
    } else {
      hidePopup();
      startChrono();
      lastTime = 0;
      animationFrameId = requestAnimationFrame(moveInvaders);
    }
  }

  // Listen for the Escape key to toggle pause

  function handlePause(event) {
    if (event.code === "Space") {
      togglePause();
    }
    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        togglePause();
      }
    });
  }

  let lastFrameTime = performance.now();
  let frameCount = 0;
  let lastFpsUpdate = performance.now();
  let fps = 0;

  function updateFps() {
    const now = performance.now();
    let delta = now - lastFrameTime;
    frameCount++;
    if (now - lastFpsUpdate >= 1000) {
      fps = (frameCount * 1000) / (now - lastFpsUpdate);
      fpsElement.innerText = `FPS: ${fps.toFixed(1)}`;
      lastFpsUpdate = now;
      frameCount = 0;
    }
    lastFrameTime = now;
    requestAnimationFrame(updateFps);
  }
  requestAnimationFrame(updateFps);

  function handlePause(event) {
    if (event.code === "Space") {
      togglePause();
    }
  }

  // Function that displays the pop-up with the data and the image
  function showPopup() {
    if (isOverlayVisible) return; // Prevent multiple overlays

    const overlay = document.createElement("div");
    overlay.id = "overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.zIndex = "999";
    document.body.appendChild(overlay);

    const popup = document.createElement("div");
    popup.id = "popup";
    popup.style.position = "fixed";
    popup.style.left = "50%";
    popup.style.top = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.padding = "20px";
    popup.style.border = "1px solid black";
    popup.style.zIndex = "1000";
    popup.style.display = "flex";
    popup.style.flexDirection = "column";

    const resumeButton = document.createElement("button");
    resumeButton.id = "close-popup";
    resumeButton.textContent = "Continue";
    resumeButton.style.cursor = "pointer";
    resumeButton.style.marginBottom = "2vh";
    resumeButton.addEventListener("click", togglePause);
    popup.appendChild(resumeButton);

    document.body.appendChild(popup);

    overlay.addEventListener("click", hidePopup);

    const refreshButton = document.createElement("button");
    refreshButton.id = "refresh-popup";
    refreshButton.textContent = "Restart";
    refreshButton.style.cursor = "pointer";
    refreshButton.addEventListener("click", function () {
      document.querySelector(".grid").innerHTML = "";
      document.querySelector(".results").innerHTML = "Score : 0";
      results = 0;
      document.getElementById("playerLives").innerHTML = `Vies restantes : 3`;
      alienInvaders = maps[level];
      hidePopup();
      startGame(level);
    });

    popup.appendChild(refreshButton);

    const checkStory2 = document.getElementById("story2");
    if (checkStory2) {
      var style = window.getComputedStyle(checkStory2);
      if (style.display === "flex") {
        popup.removeChild(refreshButton);
      }
    }

    const checkStory3 = document.getElementById("story3");
    if (checkStory3) {
      var style = window.getComputedStyle(checkStory3);
      if (style.display === "flex") {
        popup.removeChild(refreshButton);
      }
    }

    document.body.appendChild(popup);
    isOverlayVisible = true;
  }

  function hidePopup() {
    const popup = document.getElementById("popup");
    const overlay = document.getElementById("overlay");
    if (popup) {
      document.body.removeChild(popup);
    }
    if (overlay) {
      document.body.removeChild(overlay);
    }
    isOverlayVisible = false;
  }

  /**
   * Function that stops the game
   */
  function endGame() {
    gameOver = true;
    stopChrono();
    // Condition if there are no more lives and if there are still aliens ships
    if (playerLives == 0 || aliensRemoved.length !== alienInvaders.length) {
      handleGameState("gameOver");
    } else if (playerLives >= 1) {
      handleGameState("win");
    }
    clearInterval(alienShootIntervalId);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  }

  // Pop up EndGame or Win

  function handleGameState(state) {
    console.debug(`game state : ${state} `);
    if (storyMode && level === 2) {
      // If it's the last level, display the final win or lose screen
      showFinalResult(state);
    } else {
      showGameOverPopup(state);
    }
  }

  function showFinalResult(state) {
    const winDiv = document.getElementById("story4Win");
    const looseDiv = document.getElementById("story4Loose");

    if (state === "win") {
      document.getElementById("story3").style.display = "none";
      document.getElementById("menu").style.display = "none";
      document.getElementById("parameters-btn").style.display = "none";
      document.getElementById("game").style.display = "none";
      hidePopupOver();
      winDiv.style.display = "flex";
      looseDiv.style.display = "none";
    } else {
      looseDiv.style.display = "flex";
      winDiv.style.display = "none";
      document.getElementById("story3").style.display = "none";
      document.getElementById("menu").style.display = "none";
      document.getElementById("parameters-btn").style.display = "none";
      document.getElementById("game").style.display = "none";
    }

    document.getElementById("winPart").addEventListener("click", function () {
      location.reload();
    });
    document.getElementById("loosePart").addEventListener("click", function () {
      location.reload();
    });
  }

  function showGameOverPopup(state) {
    // Créez la fenêtre popup pour le game over ici
    const popupOver = document.createElement("div");
    popupOver.id = "game-over-popup";
    const gameOverText = document.createElement("h2");
    switch (state) {
      case "gameOver":
        gameOverText.textContent = "Game Over !";
        break;
      case "win":
        gameOverText.textContent = "You Win !";
        break;
    }
    popupOver.appendChild(gameOverText);

    if (storyMode) {
      if (level === 0) {
        const nextLevelButton = document.createElement("button");
        nextLevelButton.id = "level2Button";
        nextLevelButton.textContent = "Next to level 2";
        nextLevelButton.style.cursor = "pointer";

        popupOver.appendChild(nextLevelButton);

        if (state === "gameOver") {
          popupOver.removeChild(nextLevelButton);
        }

        document.body.appendChild(popupOver);

        nextLevelButton.addEventListener("click", function () {
          document.getElementById("story2").style.display = "flex";
          document.getElementById("menu").style.display = "none";
          document.getElementById("parameters-btn").style.display = "none";
          document.getElementById("game").style.display = "none";
          level++;
          hidePopupOver();
          // startGame(level);
        });
      }

      if (level === 1) {
        const nextLevelButton = document.createElement("button");
        nextLevelButton.id = "level3Button";
        nextLevelButton.textContent = "Next to level 3";
        nextLevelButton.style.cursor = "pointer";

        popupOver.appendChild(nextLevelButton);

        if (state === "gameOver") {
          popupOver.removeChild(nextLevelButton);
        }

        document.body.appendChild(popupOver);

        nextLevelButton.addEventListener("click", function () {
          document.getElementById("story3").style.display = "flex";
          document.getElementById("menu").style.display = "none";
          document.getElementById("parameters-btn").style.display = "none";
          document.getElementById("game").style.display = "none";
          level++;
          hidePopupOver();

          startGame(level);
        });
      }

      if (level === 2) {
        const Epilogue = document.createElement("button");
        Epilogue.id = "Epilogue";
        Epilogue.textContent = "Epilogue";
        Epilogue.style.cursor = "pointer";

        popupOver.appendChild(Epilogue);
        document.body.appendChild(popupOver);
      }
    }

    const restartButton = document.createElement("button");
    restartButton.id = "restart-button";
    restartButton.textContent = "Restart";
    restartButton.style.cursor = "pointer";
    restartButton.addEventListener("click", function () {
      // Effacez le contenu du jeu, cachez la fenêtre popup et redémarrez le jeu
      grid.innerHTML = "";
      resultDisplay.innerHTML = "Score : ";
      document.getElementById("playerLives").innerHTML = `Vies restantes : 3`;
      hidePopupOver();
      alienInvaders = maps[level];
      startGame(level);
    });
    popupOver.appendChild(restartButton);
    document.body.appendChild(popupOver);
  }

  // Function to hide the popup and remove the overlay
  function hidePopupOver() {
    const popupOver = document.getElementById("game-over-popup");

    if (popupOver) {
      document.body.removeChild(popupOver);
    }
  }
}

let chronoInterval;
let startTime;
let elapsedTime = 0;
let isRunning = false;

function startChrono() {
  if (!isRunning) {
    startTime = Date.now() - elapsedTime;
    chronoInterval = setInterval(updateChrono, 1000);
    isRunning = true;
  }
}

function stopChrono() {
  if (isRunning) {
    clearInterval(chronoInterval);
    elapsedTime = Date.now() - startTime;
    isRunning = false;
  }
}

function resetChrono() {
  clearInterval(chronoInterval);
  elapsedTime = 0;
  isRunning = false;
  document.querySelector("#chronoDisplay").textContent = "00:00";
}

function updateChrono() {
  elapsedTime = Date.now() - startTime;
  let totalSeconds = Math.floor(elapsedTime / 1000);
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;

  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  document.querySelector("#chronoDisplay").textContent =
    minutes + ":" + seconds;
}

window.onload = function () {
  document.querySelector("#chronoDisplay").textContent = "00:00";
};
