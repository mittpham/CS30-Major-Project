// Super Smash Bros Clone
// Mitt Pham
// April 16, 2026
// 
// References and resources:
// https://p5js.org/reference/p5/p5.Vector/ - vector class
// https://editor.p5js.org/jeffThompson/sketches/rrssQYach - frame count
// https://gameprogrammingpatterns.com/state.html - state machines
// https://editor.p5js.org/shfitz/sketches/8s9FLdrai - switch and case
// https://ultimateframedata.com/stats - character statistics
// https://www.jeffreythompson.org/collision-detection/rect-rect.php - rect/rect collision detection
// https://editor.p5js.org/jesse_harding/sketches/dzF-WbKuk - platform collision
// https://blog.hamaluik.ca/posts/simple-aabb-collision-using-minkowski-difference/ - Minkowksi difference

// Things to do:
// Adjust marths stats
// Fix the ratio for stage - 1 meter in game is about 16 pixels
// Add landing lag for jumps - 4 frames
// Create a "blast zone"
// prevent negative stocks
// fix crouching

// Canvas constants
const SCREEN_WIDTH = 1440;
const SCREEN_HEIGHT = 810;

// Player constants and variables
const START_X = 720;
const START_Y = 600;
const SPAWN_X = 720;
const SPAWN_Y = 200;
const JUMPSQUAT_TIMER = 3;
const LANDING_LAG_TIMER = 4;
const SPAWNING_TIMER = 30;
const INVINCIBILITY_TIMER = 120;
const ANGEL_PLATFORM_TIMER = 300;
const PLAYER_STOCKS = 3;
const A_KEY = 65;
const D_KEY = 68;
const W_KEY = 87;
const S_KEY = 83;
const Q_KEY = 81;
const E_KEY = 69;

let player;

// Stage constants and variables
const STAGE_X = 320;
const STAGE_Y = 600;
const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 50;

const TOP_BLAST_ZONE = -25;
const BOTTOM_BLAST_ZONE = 835;
const LEFT_BLAST_ZONE = -25;
const RIGHT_BLAST_ZONE = 1465;

// Marth stats
let marthStats = {
  runSpeed: 4,
  initialDash: 5,
  airAcceleration: 1,
  airSpeed: 2.4,
  friction: 0.886,
  gravity: 0.6,
  fallSpeed: 8,
  fastFallSpeed: 12.8,
  shortHopPower: -10,
  fullHopPower: -15,
  doubleJumpPower: -15,
  weight: 90,
  color: "blue",
  width: 40,
  height: 80,
};

// Create the base player
class Player {
  constructor(x, y, stats) {

    // Physics and stats
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.stats = stats;
    this.stocks = PLAYER_STOCKS;
    this.percentage = 0;

    // States
    this.state = "idle"; // idle, running, crouching, airborne, jumpsquat, landing, dead, hitsun

    // Flags/Conditions
    this.direction = true;
    this.jumpSquatting = false;
    this.jumpAvailable = true;
    this.doubleJumpAvailable = false;
    this.fastFalling = false;
    this.invincible = false;
    this.touchingTop = false;
    this.touchingLeft = false;
    this.touchingRight = false;
    this.touchingBottom = false;

    // Timers
    this.jumpSquatTimer = JUMPSQUAT_TIMER;
    this.landingLagTimer = LANDING_LAG_TIMER;
    this.spawningTimer = SPAWNING_TIMER;
    this.invincibilityTimer = INVINCIBILITY_TIMER;
    this.angelPlatformTimer = ANGEL_PLATFORM_TIMER;
  }

  // Display the player
  display() {

    // Draw player from the center
    rectMode(CENTER);

    // Square to represent the player
    noStroke();
    fill(this.stats.color);
    rect(this.position.x, this.position.y, this.stats.width, this.stats.height);
  }

  // Update the player’s state and movement
  update() {

    // Check for collisions
    this.checkStageCollision(); 

    // Constant gravity
    this.addGravity();

    // Count down invincibility from angel platform
    this.countInvincibility();

    // Check state and behavior
    this.manageState();

    // Add vector forces
    this.addVectors();
  }

  // Check if the player is touching the stage
  checkStageCollision() {

    // Player edges
    let playerBottom = this.position.y + this.stats.height / 2 + this.velocity.y;
    let playerTop = this.position.y - this.stats.height / 2 + this.velocity.y;
    let playerRight = this.position.x + this.stats.width / 2 + this.velocity.x;
    let playerLeft = this.position.x - this.stats.width / 2 + this.velocity.x;

    // Stage edges
    let stageBottom = STAGE_Y + STAGE_HEIGHT;
    let stageTop = STAGE_Y;
    let stageRight = STAGE_X + STAGE_WIDTH;
    let stageLeft = STAGE_X;

    // Reset touching flags
    this.touchingBottom = false;
    this.touchingTop = false;
    this.touchingRight = false;
    this.touchingLeft = false;

    // First check if there is any collision and then detect which side is the closest
    if (playerBottom >= stageTop && playerTop <= stageBottom && playerRight >= stageLeft && playerLeft <= stageRight) {

      let bottomOverlap = stageBottom - playerTop;
      let topOverlap = playerBottom - stageTop;
      let rightOverlap = stageRight - playerLeft;
      let leftOverlap = playerRight - stageLeft;

      let minimumOverlap = Math.min(bottomOverlap, topOverlap, rightOverlap, leftOverlap);
      
      // Return true if the player is touching a side of the stage, as well as which side they are touching
      if (minimumOverlap === topOverlap) {
        this.touchingTop = true;
        this.position.y = stageTop - this.stats.height / 2;
        return true;
      }
  
      else if (minimumOverlap === bottomOverlap) {
        this.touchingBottom = true;
        this.position.y = stageBottom + this.stats.height / 2;
        this.velocity.y = 0;
        return true;
      }
  
      else if (minimumOverlap === leftOverlap) {
        this.touchingLeft = true;
        this.position.x = stageLeft - this.stats.width / 2;
        return true;
      }
      
      else if (minimumOverlap === rightOverlap) {
        this.touchingRight = true;
        this.position.x = stageRight + this.stats.width / 2;
        return true;
      }
  
      else {
        return false;
      }
    }
  }

  // Add gravity to player
  addGravity() {
    if (!this.touchingTop && this.state !== "spawning") {
      this.velocity.y += this.stats.gravity;

      // Cap the fall speed if player isn't fast falling
      if (this.velocity.y > this.stats.fallSpeed && !this.fastFalling) {
        this.velocity.y = this.stats.fallSpeed;
      }
      else if (this.fastFalling) {
        this.velocity.y = this.stats.fastFallSpeed;
      }
    }
  }

  // Count down timer for 5 seconds from spawning before removing i-frames
  countInvincibility() {
    if (this.invincible && this.state !== "spawning" && this.state !== "dead") {
      this.invincibilityTimer--;
      if (this.invincibilityTimer <= 0) {
        this.invincible = false;
      }
    }
  }

  // Add friction to player
  addFriction() {
    this.velocity.x *= this.stats.friction;
  }

  // Control the player’s states, conditions, and behavior
  manageState() {
    switch (this.state) {

    // idle state behaviors and triggers
    case "idle":

      // State behavior
      this.velocity.x = 0;
      this.addFriction();
      if (!this.invincible) {
        this.stats.color = "blue";
      }

      // State flags
      this.fastFalling = false;

      // State triggers
      if (this.jumpSquatting) {
        this.state = "jumpSquat";
      }

      if (keyIsDown(A_KEY) || keyIsDown(D_KEY)) {
        this.state = "running";
      }

      if (keyIsDown(S_KEY)) {
        this.state = "crouching";
        this.stats.height = 40;
        this.position.y += 20;
      }

      if (!this.touchingTop) {
        this.state = "airborne";
        this.jumpAvailable = false;
        this.doubleJumpAvailable = true;
      }

      if (this.position.x > RIGHT_BLAST_ZONE || this.position.x < LEFT_BLAST_ZONE || this.position.y > BOTTOM_BLAST_ZONE || this.position.y < TOP_BLAST_ZONE) {
        this.state = "dead";
        this.stocks--;
      }
      break;

    // running state behaviors and triggers
    case "running":

      // State Behavior
      this.groundMovement();
      this.addFriction();
      if (!this.invincible) {
        this.stats.color = "purple";
      }

      // State flags
      this.fastFalling = false;

      // State triggers
      if (!keyIsDown(A_KEY) && !keyIsDown(D_KEY)) {
        this.state = "idle";
      }

      if (keyIsDown(S_KEY)) {
        this.state = "crouching";
        this.stats.height = 40;
        this.position.y += 20;
      }

      if (this.jumpSquatting) {
        this.state = "jumpSquat";
      }

      if (!this.touchingTop) {
        this.state = "airborne";
        this.jumpAvailable = false;
        this.doubleJumpAvailable = true;
      }

      if (this.position.x > RIGHT_BLAST_ZONE || this.position.x < LEFT_BLAST_ZONE || this.position.y > BOTTOM_BLAST_ZONE || this.position.y < TOP_BLAST_ZONE) {
        this.state = "dead";
        this.stocks--;
      }
      break;

      // crouching state behaviors and triggers
    case "crouching":

      // State behaviours
      this.addFriction();
      if (!this.invincible) {
        this.stats.color = "orange";
      }

      // State triggers
      
      if (!keyIsDown(S_KEY)) {
        this.state = "idle";
        this.stats.height = 80;
        this.position.y -= 20;

        if (keyIsDown(A_KEY) || keyIsDown(D_KEY)) {
          this.state = "running";
          this.stats.height = 80;
          this.position.y -= 20;
        }
      } 

      break;

    // airborne state behaviors and triggers
    case "airborne":

      // State behavior
      this.airMovement();
      if (!this.fastFalling && !this.invincible) {
        this.stats.color = "pink";
      }

      // State triggers
      if (this.touchingTop) {
        this.state = "landing";

        // Reset velocity and snap to stage
        this.velocity.y = 0;
        this.position.y = STAGE_Y - this.stats.height / 2;
      }

      if (this.position.x > RIGHT_BLAST_ZONE || this.position.x < LEFT_BLAST_ZONE || this.position.y > BOTTOM_BLAST_ZONE || this.position.y < TOP_BLAST_ZONE) {
        this.state = "dead";
        this.stocks--;
      }
      break;

    // jumpSquat state behaviours and trigger
    case "jumpSquat":

      // State behavior
      this.prepareGroundJump();
      this.addFriction();

      // State triggers
      if (!this.touchingTop) {
        this.state = "airborne";
      }

      if (this.position.x > RIGHT_BLAST_ZONE || this.position.x < LEFT_BLAST_ZONE || this.position.y > BOTTOM_BLAST_ZONE || this.position.y < TOP_BLAST_ZONE) {
        this.state = "dead";
        this.stocks--;
      }
      break;

    // Landing state behaviours and trigger
    case "landing":

      // State behaviour
      this.addFriction();
      this.landingLagTimer--;
      if (!this.invincible) {
        this.stats.color = "red";
      }

      // State triggers
      if (this.landingLagTimer <= 0) {
        this.state = "idle";

        // Reset jumpsquat timer and jumps
        this.jumpAvailable = true;
        this.doubleJumpAvailable = false;
        this.jumpSquatting = false;
        this.fastFalling = false;
        this.jumpSquatTimer = JUMPSQUAT_TIMER;
        this.landingLagTimer = LANDING_LAG_TIMER;
      }

      if (this.position.x > RIGHT_BLAST_ZONE || this.position.x < LEFT_BLAST_ZONE || this.position.y > BOTTOM_BLAST_ZONE || this.position.y < TOP_BLAST_ZONE) {
        this.state = "dead";
        this.stocks--;
      }
      break;

    // Dead state behavior
    case "dead":

      // State behavior
      this.spawningTimer--;

      // State trigger
      if (this.spawningTimer <= 0) {
        this.resetPlayer();
        this.state = "spawning";
      }

      break;

    // Spawning state behavior
    case "spawning":

      // State behavior
      this.angelPlatform();

      // State triggers
      if (keyIsDown(S_KEY)) {
        this.state = "airborne";
        this.fastFalling = true;
      }

      if (keyIsDown(A_KEY) || keyIsDown(D_KEY) || this.angelPlatformTimer <= 0) {
        this.angelPlatformTimer = 300;
        this.state = "airborne";
      }
      break;
    }

  }

  // Move player on the stage
  groundMovement() {

    // Move right
    if (keyIsDown(D_KEY)) {
      this.acceleration.add(this.stats.initialDash, 0);
      this.direction = true;
    }

    // Move left
    if (keyIsDown(A_KEY)) {
      this.acceleration.add(-this.stats.initialDash, 0);
      this.direction = false;
    }
  }

  // make the player smaller
  crouch() {
    if (keyIsDown(S_KEY)) {
      this.stats.height = 40;
      this.position.y += 40;
    }
  }

  // Move player in the air
  airMovement() {

    // Move right
    if (keyIsDown(D_KEY)) {
      this.acceleration.add(this.stats.airAcceleration, 0);
      this.direction = true;
    }

    // Move left
    if (keyIsDown(A_KEY)) {
      this.acceleration.add(-this.stats.airAcceleration, 0);
      this.direction = false;
    }
  }

  // Jump to fastfall speed if player presses down
  fastFall() {

    // Condition to fastfall is player is either at the peak of their jump or falling
    if (this.velocity.y >= 0) {
      this.fastFalling = true;

      if (this.fastFalling && !this.invincible) {
        this.stats.color = "green";
      }
    }
  }

  // Pause before the player jumps
  prepareGroundJump() {
    this.jumpSquatTimer--;
    if (!this.invincible) {
      this.stats.color = "red";
    }
    if (this.jumpSquatTimer <= 0) {
      this.jumpSquatting = false;
      this.groundJump();
    }
  }

  // Make player jump from the ground
  groundJump() {
    if (this.jumpAvailable) {

      // Determine jump height
      if (keyIsDown(Q_KEY)) {
        this.velocity.y = this.stats.shortHopPower;
      }
      else if (keyIsDown(W_KEY)) {
        this.velocity.y = this.stats.fullHopPower;
      }
      else {
        this.velocity.y = this.stats.shortHopPower;
      }

      // Disable ground jump and unlock double jump
      this.jumpAvailable = false;
      this.doubleJumpAvailable = true;
    }
  }

  // Double jump
  doubleJump() {
    if (this.doubleJumpAvailable) {
      this.velocity.y = this.stats.doubleJumpPower;

      // Disable double jump and fast falling
      this.fastFalling = false;
      this.doubleJumpAvailable = false;
    }
  }

  // Apply user input to player
  addVectors() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    // Cap speeds corresponding to state
    if (this.state === "running" || this.state === "idle") {
      this.velocity.x = constrain(this.velocity.x, -this.stats.runSpeed, this.stats.runSpeed);
    }
    if (this.state === "airborne") {
      this.velocity.x = constrain(this.velocity.x, -this.stats.airSpeed, this.stats.airSpeed);
    }
  }

  // Reset player if dead
  resetPlayer() {

    // Reset player states and flags
    this.percentage = 0;
    this.direction = true;
    this.jumpSquatting = false;
    this.jumpAvailable = false;
    this.doubleJumpAvailable = true;
    this.fastFalling = false;
    this.invincible = true;
    this.stats.height = 80;

    // Reset timers
    this.invincibilityTimer = INVINCIBILITY_TIMER;
    this.spawningTimer = SPAWNING_TIMER;
  }

  // Put player on the angel platform and prevent all damage until input
  angelPlatform() {

    // Start the timer for how long you can stay on the angel platform
    this.angelPlatformTimer--;

    // Reset player position
    this.position.x = SPAWN_X;
    this.position.y = SPAWN_Y;

    // Halt all movement
    this.acceleration.mult(0);
    this.velocity.mult(0);

    // Make player white to show invincibility
    if (this.invincible) {
      this.stats.color = "white";
    }
  }
}

// Setup player
function setup() {
  createCanvas(SCREEN_WIDTH, SCREEN_HEIGHT);

  // Create player
  player = new Player(START_X, START_Y - marthStats.height / 2, marthStats);

  // Create stage
  rectMode(CORNER);
  fill("white");
  rect(STAGE_X, STAGE_Y, STAGE_WIDTH, STAGE_HEIGHT);
}

// Manage players
function draw() {
  background(0);

  // Draw stage
  rectMode(CORNER);
  fill("white");
  rect(STAGE_X, STAGE_Y, STAGE_WIDTH, STAGE_HEIGHT);

  // Update player states and movement
  player.update();

  // Display player
  player.display();
}

// Handle player input
function keyPressed() {

  // Jumping
  if (keyCode === W_KEY || keyCode === Q_KEY) {

    // Angel platform jump
    if (player.state === "spawning") {
      player.state = "airborne";
      player.doubleJump();
    }

    // Ground jump
    else if (player.jumpAvailable) {
      player.jumpSquatting = true;
    }

    // Double jump
    else if (player.doubleJumpAvailable) {
      player.doubleJump();
    }
  }

  // Fast falling
  if (keyCode === S_KEY) {

    // Check that player is airborne
    if (player.state === "airborne") {
      player.fastFall();
    }
  }
}

