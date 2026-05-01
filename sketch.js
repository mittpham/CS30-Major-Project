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
// https://www.youtube.com/watch?v=CxvdO_kkXmY - smash bros knockback explanation
// https://www.ssbwiki.com/Knockback - smash knockback formula
// https://kuroganehammer.com/Ultimate/Marth - Marth knockback and damage values
// https://www.youtube.com/playlist?list=PLf9yt-2olqyLxr-vouWl-qk4toUfjF2LC - street fighter clone
// https://www.ssbwiki.com/Hitstun - hitstun
// https://www.ssbwiki.com/Tumbling - tumbling

// Things to do:
// Adjust marths stats
// Fix the ratio for stage - 1 meter in game is about 16 pixels
// Add landing lag for jumps - 4 frames
// Create a "blast zone"
// prevent negative stocks
// Implement soft and hard landing
// Create the first hitbox
// Implement "sakurai's special angle"

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
const U_KEY = 85;

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
  currentHeight: 0,
  idleHeight: 80,
  crouchHeight: 40,
  offsetCrouchHeight: 20,
};

// Marth attacks
let marthForwardTilt = {
  offsetX: 10,
  offsetY: 20,
  width: 40,
  height: 30,
  startingFrames: 8,
  activeFrames: 3,
  endingFrames: 22,
  damage: 12,
  angle: 45,
  knockback: 55,
  growthKnockback: 85,
  shieldStun: 11,
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
    this.currentAttack = null;
    this.hitboxes = [];

    // States
    this.state = "idle"; // idle, running, crouching, airborne, jumpsquat, landing, dead, spawning, attacking

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
    this.attackFrameTimer = 0;
  }

  // Display the player
  display() {

    // Draw player from the center
    rectMode(CENTER);

    // Square to represent the player
    noStroke();
    fill(this.stats.color);
    rect(this.position.x, this.position.y, this.stats.width, this.stats.currentHeight);

    // Draw hitboxes
    this.currentAttack.display();
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
    let playerBottom = this.position.y + this.stats.currentHeight / 2 + this.velocity.y;
    let playerTop = this.position.y - this.stats.currentHeight / 2 + this.velocity.y;
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

      // Find the amount of overlap on each edge
      let bottomOverlap = stageBottom - playerTop;
      let topOverlap = playerBottom - stageTop;
      let rightOverlap = stageRight - playerLeft;
      let leftOverlap = playerRight - stageLeft;

      // Find the smallest overlap
      let minimumOverlap = Math.min(bottomOverlap, topOverlap, rightOverlap, leftOverlap);
      
      // Push the player out of the nearest side and return which side was touched as well as a true or false
      if (minimumOverlap === topOverlap) {
        this.touchingTop = true;
        this.position.y = stageTop - this.stats.currentHeight / 2;
        return true;
      }
  
      else if (minimumOverlap === bottomOverlap) {
        this.touchingBottom = true;
        this.position.y = stageBottom + this.stats.currentHeight / 2;
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

    // Only add gravity if the player isn't touching the top of the stage or on the angel platform
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

    // Begin counting if the player is playing and invincible
    if (this.invincible && this.state !== "spawning" && this.state !== "dead") {
      this.invincibilityTimer--;

      // Remove invincibility
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
        this.stats.currentHeight = this.stats.crouchHeight;
        this.position.y += this.offsetCrouchHeight;
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
        this.stats.currentHeight = this.stats.crouchHeight;
        this.position.y += this.stats.offsetCrouchHeight;
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
        this.stats.currentHeight = this.stats.idleHeight;
        this.position.y -= this.stats.offsetCrouchHeight;

        if (keyIsDown(A_KEY) || keyIsDown(D_KEY)) {
          this.state = "running";
          this.stats.currentHeight = this.stats.idleHeight;
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
        this.position.y = STAGE_Y - this.stats.currentHeight / 2;
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

    // attacking state behavior
    case "attacking":

      // State behavior
      this.addFriction();

      // Control the hitboxes
      for (let hitbox of this.hitboxes) {

        hitbox.currentFrame++;
        hitbox.update(this.position.x, this.position.y, this.direction);

        if (hitbox.currentFrame > hitbox.totalFrames) {
          this.hitboxes.splice(hitbox, 1);
        }
      }

      // State triggers
      

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
      this.stats.currentHeight = this.stats.crouchHeight;
      this.position.y += this.stats.crouchHeight;
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

  // Create the new attack
  spawnHitbox() {
    this.currentAttack = new Attack(this.direction, this.position.x, this.position.y, marthForwardTilt.offsetX, 
      marthForwardTilt.offsetY, marthForwardTilt.width, marthForwardTilt.height, marthForwardTilt.damage, 
      marthForwardTilt.startingFrames, marthForwardTilt.activeFrames, marthForwardTilt.endingFrames, 
      marthForwardTilt.angle, marthForwardTilt.knockback, marthForwardTilt.growthKnockback);

    this.hitboxes.push(this.currentAttack);
    this.state = "attacking";
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
    this.stats.currentHeight = this.stats.idleHeight;

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

// Create an attack
class Attack {
  constructor(playerDirection, playerX, playerY, attackOffsetX, attackOffsetY, attackWidth, attackHeight, attackDamage, 
    attackStartingFrames, attackActiveFrames, attackEndingFrames, attackAngle, attackBaseKnockback, attackGrowthKnockBack) {

    // Hitbox and size
    this.x = 0;
    this.y = 0;
    this.offsetX = attackOffsetX;
    this.offsetY = attackOffsetY;
    this.w = attackWidth;
    this.h = attackHeight;

    // Damage and knockback
    this.damage = attackDamage;
    this.knockback = attackBaseKnockback;
    this.growthKnockback = attackGrowthKnockBack;
    this.angle = attackAngle;

    // Frame data
    this.startingFrames = attackStartingFrames;
    this.activeFrames = attackActiveFrames;
    this.endingFrames = attackEndingFrames;
    this.totalFrames = this.startingFrames + this.activeFrames + this.endingFrames;
    this.currentFrame = 0;
  }

  // Show the hitbox for the attack
  display() {

    // No hitbox if the active is either starting or ending
    if (this.currentFrame <= this.startingFrames || this.currentFrame > this.startingFrames + this.activeFrames) {
      noFill();
      rect(this.x, this.y, this.w, this.h);
    }

    // Add a hitbox if the attack is active
    else if (this.currentFrame > this.startingFrames || this.currentFrame <= this.startingFrames + this.activeFrames) {
      fill("blue");
      rect(this.x, this.y, this.w, this.h);
    }
  }

  // Move the hitbox with the player
  update(playerX, playerY, playerDirection) {

    // Determine the offset X position based off of the players direction
    if (!playerDirection) {
      this.offsetX *= -1;
    }
    else {
      this.offsetX *= 1;
    }

    // Attach the hitbox to the player
    this.x = playerX + this.offsetX;
    this.y = playerY + this.offsetY;
  }

  // Determine the angle, hitstun, and kncokback of the move
  calculateKnockback() {

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

// Handle player input for single events
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

  // Attacking
  if (keyCode === U_KEY) {
    player.spawnHitbox();
  }
}

