
// Main game object
// ----------------

// **new Game()** Creates the game object with the game state and logic.
class Game {

  constructor() {
    
    // In index.html, there is a canvas tag that the game will be drawn in.
    // Grab that canvas out of the DOM.
    let canvas = document.getElementById("rhodium");

    // Get the drawing context.  This contains functions that let you draw to the canvas.
    let screen = canvas.getContext('2d');
    screen.canvas.width  = window.innerWidth;
    screen.canvas.height = window.innerHeight;

    // Note down the dimensions of the canvas.  These are used to
    // place game bodies.
    this.gameSize = { x: canvas.width, y: canvas.height };

    // Create the bodies array to hold the player, invaders and bullets.
    this.bodies = [];

    // Add the invaders to the bodies array.
    this.bodies = this.bodies.concat(createInvaders(this));

    // Add the player to the bodies array.
    this.bodies = this.bodies.concat(new Player(this));

    // In index.html, there is an audio tag that loads the shooting sound.
    // Get the shoot sound from the DOM and store it on the game object.
    this.shootSound = document.getElementById('shoot-sound');

    // Load the font for titles
    const fontTitle = {
      "image": document.getElementById("font-title"),
      "characters": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", " "],
      "widths": [31, 31, 31, 31, 31, 31, 31, 31, 19, 31, 31, 31, 43, 31, 31, 31, 31, 31, 31, 31, 31, 31, 43, 31, 31, 31, 31, 21, 31, 31, 31, 31, 31, 31, 31, 31, 21],
      "height": 33
    };
    
    // Load the font for normal text
    const fontNormal = {
      "image": document.getElementById("font-normal"),
      "characters": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "!", "?", " "],
      "widths": [15, 15, 15, 15, 15, 15, 15, 15, 9, 15, 15, 15, 21, 15, 15, 15, 15, 15, 15, 15, 15, 15, 21, 15, 15, 15, 15, 10, 15, 15, 15, 15, 15, 15, 15, 15, 9, 15, 10],
      "height": 14
    };
    
    // The game is considered to be started only after the player's first interaction
    this.started = false;

    let self = this;

    // Main game tick function.  Loops forever until the game is over, running 60ish times a second.
    let tick = function() {

      // Remove the original event listener set at the very start of the game session
      window.removeEventListener("touchstart", tick);

      // Update game state.
      self.update();

      // Draw game bodies.
      self.draw(screen);

      // Game over if the Player object is not in the bodies anymore
      // Or one Invader has reached the Earth (player has lost)
      let playerLost = (self.bodies.filter(function(b) { return b instanceof Player; }).length === 0) 
        || (self.bodies.filter(function(b) { 
          return (b instanceof Invader) && (b.center.y + b.size.y / 2 > self.gameSize.y);
        }).length > 0);

      // Or there is no Invader left (player has won)
      let playerWon = (self.bodies.filter(function(b) { return b instanceof Invader; }).length === 0);

      if (playerLost || playerWon) {
        // The game doesn't run anymore
        self.started = false;
        // Add a transparent layer with opacity
        screen.globalAlpha=0.7;
        screen.fillStyle='#ffffff';
        screen.fillRect(0, 0, self.gameSize.x, self.gameSize.y);
        // Reset the opacity
        screen.globalAlpha=1;
        drawText(fontTitle, screen, self.gameSize.y / 2 - 100, "GAME OVER");
        if (playerWon) {
          // let imgYouWon = document.getElementById("you-won");
          // screen.drawImage(imgYouWon, 90, self.gameSize.y / 2, self.gameSize.x - 180, 20);
          drawText(fontNormal, screen, self.gameSize.y / 2 - 50, "YOU WON!");
        } else {
          // let imgYouLost = document.getElementById("you-lost");
          // screen.drawImage(imgYouLost, 90, self.gameSize.y / 2, self.gameSize.x - 180, 20);
          drawText(fontNormal, screen, self.gameSize.y / 2 - 50, "YOU LOST!");
        }
        // Play again?
        drawText(fontNormal, screen, self.gameSize.y / 2 + 50, "TAP TO PLAY AGAIN");
        window.addEventListener("touchstart", start, { passive: false });

      } else {
        // Queue up the next call to tick with the browser.
        requestAnimationFrame(tick);
      }
    };

    // If it is a new game session, show the welcome screen
    if (newGame) {
      drawText(fontTitle, screen, self.gameSize.y / 2 - 100, "RHODIUM");
      drawText(fontNormal, screen, self.gameSize.y / 2 + 50, "TAP TO PLAY");
      newGame = false;
      window.addEventListener("touchstart", tick);
    } else {
      // Run the  game tick.  All future calls will be scheduled by the tick() function itself.
      tick();
    }

  }

  // **update()** runs the main game logic.
  update() {
    let self = this;

    // `notCollidingWithAnything` returns true if passed body is not colliding with anything.
    let notCollidingWithAnything = function(b1) {
      return self.bodies.filter(function(b2) { return colliding(b1, b2); }).length === 0;
    };

    // Throw away bodies that are colliding with something. They will never be updated or draw again.
    this.bodies = this.bodies.filter(notCollidingWithAnything);

    // Call update on every body.
    for (let i = 0; i < this.bodies.length; i++) {
      this.bodies[i].update();
    }
  }

  // **draw()** draws the game.
  draw(screen) {
    // Clear away the drawing from the previous tick.
    screen.clearRect(0, 0, this.gameSize.x, this.gameSize.y);

    // Draw each body as a rectangle.
    for (let i = 0; i < this.bodies.length; i++) {
      drawRect(screen, this.bodies[i]);
    }
  }

  // **invadersBelow()** returns true if `invader` is directly above at least one other invader.
  invadersBelow(invader) {
    // If filtered array is not empty, there are invaders below.
    return this.bodies.filter(function(b) {
      // Keep `b` if it is an invader, if it is in the same column as `invader`, and if it is somewhere below `invader`.
      return b instanceof Invader &&
        Math.abs(invader.center.x - b.center.x) < b.size.x &&
        b.center.y > invader.center.y;
    }).length > 0;
  }

  // **addBody()** adds a body to the bodies array.
  addBody(body) {
    this.bodies.push(body);
  }

}

// Invaders
// --------

// **new Invader()** creates an invader.
class Invader {

  constructor(game, center) {
    this.game = game;
    this.center = center;
    this.size = { x: 15, y: 15 };

    // Invaders patrol from left to right and back again.
    // `this.patrolX` records the current (relative) position of the
    // invader in their patrol.  It starts at 0, increases to 40, then
    // decreases to 0, and so forth.
    this.patrolX = 0;

    // The x speed of the invader.  A positive value moves the invader right. A negative value moves it left.
    this.speedX = 0.3;
  }

  // **update()** updates the state of the invader for a single tick.
  update() {

    if (this.game.started) {

      // If the invader is outside the bounds of their patrol...
      if (this.patrolX < 0 || this.patrolX > 30) {

        // ... reverse direction of movement.
        this.speedX = -this.speedX;

        // Change direction means moving closer to the player
        this.center.y += 10;
      }

      // If coin flip comes up and no friends below in this invader's column...
      if (Math.random() > 0.99 &&
          !this.game.invadersBelow(this)) {

        // ... create a bullet just below the invader that will move downward...
        let bullet = new Bullet({ x: this.center.x, y: this.center.y + this.size.y / 2 },
                                { x: Math.random() - 0.5, y: 2 });

        // ... and add the bullet to the game.
        this.game.addBody(bullet);
      }

      // Move according to current x speed.
      this.center.x += this.speedX;

      // Update let iable that keeps track of current position in patrol.
      this.patrolX += this.speedX;
    }

  }

}

// **createInvaders()** returns an array of twenty-four invaders.
function createInvaders(game) {
  let invaders = [];
  for (let i = 0; i < 24; i++) {

    // Place invaders in eight columns.
    let x = 30 + (i % 8) * 30;

    // Place invaders in three rows.
    let y = 30 + (i % 3) * 30;

    // Create invader.
    invaders.push(new Invader(game, { x: x, y: y}));
  }

  return invaders;
}

// Player
// ------

// **new Player()** creates a player.
class Player {

  constructor(game) {
    this.game = game;
    this.size = { x: 38, y: 34 };
    this.center = { x: game.gameSize.x / 2, y: game.gameSize.y - this.size.y * 3 };

    // Create a touch manager object to track touches.
    this.touchmanager = new TouchManager();
    this.onTheMove = false;
    this.bulletTimer = 0;
  }

  // **update()** updates the state of the player for a single tick.
  update() {

    // If there is an ongoing touch...
    if (this.touchmanager.isTouch()) {

      // Get the coordinates of the touch
      let touchX = this.touchmanager.touchX();
      let touchY = this.touchmanager.touchY();

      // It is a valid touch if the player is already on the move
      // Or if it is a new touch and the player is right above the touch area...
      if ( this.onTheMove || ( (touchX > this.center.x - this.size.x / 2) && 
                               (touchX < this.center.x + this.size.x / 2) &&
                               (touchY > this.center.y + this.size.y) && 
                               (touchY < this.center.y + this.size.y * 2) ) ) {
        // The game is on
        this.game.started = true;
        this.onTheMove = true;

        this.center.x = touchX;
        this.center.y = touchY - this.size.y * 2;

      }

      // Shoot a bullet every 30th update (about 1 every half second)
      if (this.bulletTimer === 30) {
        let bullet = new Bullet({ x: this.center.x, y: this.center.y - this.size.y / 2 }, { x: 0, y: -7 });
        
        // ... add the bullet to the game...
        this.game.addBody(bullet);

        // ... rewind the shoot sound...
        this.game.shootSound.load();

        // ... play the shoot sound...
        this.game.shootSound.play();

        // ... and reset the bullet timer
        this.bulletTimer = 0;

      } else {
        this.bulletTimer += 1;
      }

    } else {
      this.onTheMove = false;
    }

  }

}

// Bullet
// ------

// **new Bullet()** creates a new bullet.
class Bullet {

  constructor(center, velocity) {
    this.center = center;
    this.size = { x: 3, y: 3 };
    this.velocity = velocity;
  }

  // **update()** updates the state of the bullet for a single tick.
  update() {

    // Add velocity to center to move bullet.
    this.center.x += this.velocity.x;
    this.center.y += this.velocity.y;
  }

}

// Touch input tracking
// --------------------

// **new TouchManager()** creates a new touch input tracking object.
class TouchManager {
  constructor() {

    // Keeps track of the touch in progress
    let ongoingTouch = {};

    // When touch starts
    window.addEventListener("touchstart", function(evt) {
      evt.preventDefault();
      let touches = evt.changedTouches;
      ongoingTouch.identifier = touches[0].identifier;
      ongoingTouch.pageX = touches[0].pageX;
      ongoingTouch.pageY = touches[0].pageY;
    }, { passive: false });

    // When touch moves
    window.addEventListener("touchmove", function(evt) {
      evt.preventDefault();
      let touches = evt.changedTouches;
      if (touches[0].identifier === ongoingTouch.identifier) {
        ongoingTouch.pageX = touches[0].pageX;
        ongoingTouch.pageY = touches[0].pageY;  
      } else {
        console.log("WARNING - Can't figure out which touch to continue");
      }
    }, { passive: false });

    // When touch ends, reset the ongoing touch
    window.addEventListener("touchend", function(evt) {
      ongoingTouch = {};
    }, { passive: false });

    // When touch is cancelled, reset the ongoing touch
    window.addEventListener("touchcancel", function(evt) {
      ongoingTouch = {};
    }, { passive: false });

    // Returns true if there is an ongoing touch
    this.isTouch = function() {
      return ongoingTouch.hasOwnProperty('identifier');
    };

    // Return the X coordinate of the ongoing touch if any
    this.touchX = function() {
      if (ongoingTouch.hasOwnProperty('pageX')) {
        return ongoingTouch.pageX;
      } else {
        return -1;
      }
    }
  
    // Return the Y coordinate of the ongoing touch if any
    this.touchY = function() {
      if (ongoingTouch.hasOwnProperty('pageY')) {
        return ongoingTouch.pageY;
      } else {
        return -1;
      }
    }

  }

}

// Other functions
// ---------------

// **drawRect()** draws passed body as a rectangle to `screen`, the drawing context.
function drawRect(screen, body) {
  if (body instanceof Player) {
    let imgPlayer = document.getElementById("player");
    screen.drawImage(imgPlayer, body.center.x - body.size.x / 2, body.center.y - body.size.y / 2);
    // If the player is not moving, draw the touch indicator beneath it
    if (!body.onTheMove) {
      let imgTouch = document.getElementById("touch");
      screen.drawImage(imgTouch, body.center.x - body.size.x / 2, body.center.y + body.size.y);
    }
  } else if (body instanceof Invader) {
    let imgInvader = document.getElementById("invader");
    screen.drawImage(imgInvader, body.center.x - body.size.x / 2, body.center.y - body.size.y / 2);
  } else {
    screen.fillRect(body.center.x - body.size.x / 2, body.center.y - body.size.y / 2,
      body.size.x, body.size.y);
  }
}

// **colliding()** returns true if two passed bodies are colliding.
// The approach is to test for six situations.  If any are true,
// the bodies are definitely not colliding.  If none of them
// are true, the bodies are colliding.
// 1. b1 is the same body as b2.
// 2. Right of `b1` is to the left of the left of `b2`.
// 3. Bottom of `b1` is above the top of `b2`.
// 4. Left of `b1` is to the right of the right of `b2`.
// 5. Top of `b1` is below the bottom of `b2`.
// 6. b1 and b2 ar both bullets
function colliding(b1, b2) {
  return !(
    b1 === b2 ||
      b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 ||
      b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 ||
      b1.center.x - b1.size.x / 2 > b2.center.x + b2.size.x / 2 ||
      b1.center.y - b1.size.y / 2 > b2.center.y + b2.size.y / 2 ||
      ( (b1 instanceof Bullet) && (b2 instanceof Bullet) )
  );
}

// Fonts
// -----

// Draw the text at the Y position on the screen with the selected font
function drawText(font, screen, y, text) {
  let t = text.toUpperCase();
  let charPos = [], charLen = [];
  for (let i = 0; i < t.length; i++) {
    let pos = font.characters.indexOf(t[i]);
    if (pos > -1) {
      charPos.push(pos);
      charLen.push(font.widths[pos]);
    }
  }
  let length = charLen.reduce(function(accumulator, currentValue) {
    return accumulator + currentValue;
  });
  // Center the text horizontally by adding the necessary offset on the left
  let leftOffset = Math.round((screen.canvas.width - length) / 2);
  for (let i = 0; i < charPos.length; i++) {
    let sx = font.widths.slice(0, charPos[i]).reduce(function(a,c) { return a + c}, 0);
    screen.drawImage(font.image, sx, 0, charLen[i], font.height, leftOffset, y, charLen[i], font.height);
    leftOffset += charLen[i];
  }
}

// Start game
// ----------

var newGame = true;

function start() {
  window.removeEventListener("touchstart", start, { passive: false });
  new Game();
}

// When the DOM is ready, create (and start) the game.
window.addEventListener('load', start);

