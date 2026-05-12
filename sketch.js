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
// https://kuroganehammer.com/Ultimate/Marth - Marth knockback and damage values
// https://www.jeffreythompson.org/collision-detection/rect-rect.php - rect/rect collision detection
// https://blog.hamaluik.ca/posts/simple-aabb-collision-using-minkowski-difference/ - Minkowksi difference
// https://www.youtube.com/watch?v=CxvdO_kkXmY - smash bros knockback explanation
// https://www.ssbwiki.com/Knockback - smash knockback formula
// https://www.ssbwiki.com/Hitstun - hitstun
// https://www.ssbwiki.com/Tumbling - tumbling
// https://www.ssbwiki.com/Sakurai_angle - Sakurai's special angle
// https://editor.p5js.org/jesse_harding/sketches/dzF-WbKuk - platform collision
// https://www.youtube.com/playlist?list=PLf9yt-2olqyLxr-vouWl-qk4toUfjF2LC - street fighter clone

// In game:
// https://www.spriters-resource.com/custom_edited/supersmashbroscustoms/asset/62979/ - stage
// https://www.youtube.com/watch?v=wrZd9ox36BE - background
// https://www.101soundboards.com/boards/1048309-marth-super-smash-bros-ultimate - marth sounds
// https://www.deviantart.com/the-screen-ko-plus/art/SSBC-Marth-Sprite-Sheet-Reupload-1125121853 - marth sprites
// https://www.youtube.com/watch?v=6JYnDGh5mCE&list=PLYzPRovwO_fOl0WuwqizjhPLbIwnks8Lg&index=6 - music

// Things to do:
// 1. fix damage output
// 2. Implement "sakurai's special angle"
// 3. Refactor stage into a class
// 4. fix spawning x and y to be different for both players
// 5. prevent negative stocks
// 6. Adjust marths stats
// 7. Fix the ratio for stage - 1 meter in game is about 16 pixels


// Canvas constants
const SCREEN_WIDTH = 1440;
const SCREEN_HEIGHT = 810;

// Universal player variables and constants
const JUMPSQUAT_TIMER = 3;
const SOFT_LANDING_LAG_TIMER = 2;
const HARD_LANDING_LAG_TIMER = 4;
const SPAWNING_TIMER = 30;
const INVINCIBILITY_TIMER = 120;
const ANGEL_PLATFORM_TIMER = 300;
const PLAYER_STOCKS = 3;

// Player 1 constants and variables
const PLAYER_ONE_START_X = 520;
const PLAYER_ONE_START_Y = 600;
const PLAYER_ONE_SPAWN_X = 520;
const PLAYER_ONE_SPAWN_Y = 200;

let playerOneControls = {
  left: 65, // A key
  right: 68, // D key
  up: 87, // W key
  down: 83, // S key
  shortHop: 81, // Q key
  attack: 85, // U key
};

let playerOne;

// Player 2 constants and variables
const PLAYER_TWO_START_X = 920;
const PLAYER_TWO_START_Y = 600;
const PLAYER_TWO_SPAWN_X = 920;
const PLAYER_TWO_SPAWN_Y = 200;

let playerTwoControls = {
  left: 37, // Left arrow
  right: 39, // Right arrow
  up: 38, // Up arrow
  down: 40, // Down arrow
  shortHop: 36, // Home / Numberpad 7
  attack: 191, // Slash
};

let playerTwo;

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
let playerOneMarthStats = {
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
  currentHeight: 80,
  idleHeight: 80,
  crouchHeight: 40,
  offsetCrouchHeight: 20,
};

let playerTwoMarthStats = {
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
  currentHeight: 80,
  idleHeight: 80,
  crouchHeight: 40,
  offsetCrouchHeight: 20,
};

// Marth attacks
let marthForwardTilt = {
  offsetX: 60,
  offsetY: 0,
  width: 80,
  height: 90,
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
  constructor(x, y, stats, controls) {

    // Physics and stats
    this.controls = controls;
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.stats = stats;
    this.stocks = PLAYER_STOCKS;
    this.percentage = 0;
    this.currentAttack = null;
    this.hitboxes = [];

    // States
    this.state = "idle"; // idle, running, crouching, airborne, jumpsquat, landing, dead, spawning, attacking, hitstun

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
    this.landingLagTimer = 0;
    this.spawningTimer = SPAWNING_TIMER;
    this.invincibilityTimer = INVINCIBILITY_TIMER;
    this.angelPlatformTimer = ANGEL_PLATFORM_TIMER;
    this.attackFrameTimer = 0;
    this.hitstunTimer = 0;
  }

  // Display the player and hitboxes
  display() {

    // Draw player from the center
    rectMode(CENTER);

    // Square to represent the player
    noStroke();
    fill(this.stats.color);
    rect(this.position.x, this.position.y, this.stats.width, this.stats.currentHeight);

    // Draw hitboxes
    for (let hitbox of this.hitboxes) {
      hitbox.display();
    }
  }

  // Update the player’s state and movement
  update(player) {

    // Count down invincibility from angel platform
    this.countInvincibility();

    // Check state and behavior
    this.manageState();
    
    // Constant gravity
    this.addGravity();
    
    // Add vector forces
    this.addVectors();

    // Check for collisions with the stage
    this.checkStageCollision(); 

    // Check for collisions between hitboxes and hurtboxes of player
    this.checkAttackCollision(player);
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

  // Add friction to player
  addFriction() {
    this.velocity.x *= this.stats.friction;
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

  // Use player 2 as the hurtbox to check if any attack's hitbox collides with them
  checkAttackCollision(hurtbox) {

    // Make sure that there is an attack out currently
    if (this.currentAttack !== null) {

      // Player's hitbox's edges
      let hitboxBottom = this.currentAttack.y + this.currentAttack.h / 2;
      let hitboxTop = this.currentAttack.y - this.currentAttack.h / 2;
      let hitboxRight = this.currentAttack.x + this.currentAttack.w / 2;
      let hitboxLeft = this.currentAttack.x - this.currentAttack.w / 2;
  
      // Enemy's hurtbox's edges
      let hurtboxBottom = hurtbox.position.y + hurtbox.stats.currentHeight / 2;
      let hurtboxTop = hurtbox.position.y - hurtbox.stats.currentHeight / 2;
      let hurtboxRight = hurtbox.position.x + hurtbox.stats.width / 2;
      let hurtboxLeft = hurtbox.position.x - hurtbox.stats.width / 2;
  
      // Add damage and calculate knockback if there is a collision
      if (hitboxBottom >= hurtboxTop && hitboxTop <= hurtboxBottom && 
      hitboxRight >= hurtboxLeft && hitboxLeft <= hurtboxRight) {
        this.currentAttack.calculateKnockback(hurtbox);

        console.log(hurtbox.percentage);
      }
      else {
        console.log('no hit');
      }
    }
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

      if (keyIsDown(this.controls.left) || keyIsDown(this.controls.right)) {
        this.state = "running";
      }

      if (keyIsDown(this.controls.down)) {
        this.state = "crouching";
        this.stats.currentHeight = this.stats.crouchHeight;
        this.position.y += this.stats.offsetCrouchHeight;
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
      if (!keyIsDown(this.controls.left) && !keyIsDown(this.controls.right)) {
        this.state = "idle";
      }

      if (keyIsDown(this.controls.down)) {
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
      
      if (!keyIsDown(this.controls.down)) {
        this.state = "idle";
        this.stats.currentHeight = this.stats.idleHeight;
        this.position.y -= this.stats.offsetCrouchHeight;

        if (keyIsDown(this.controls.left) || keyIsDown(this.controls.right)) {
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

        // Choose landing lag depending on the player's fall speed
        if (this.fastFalling) { 
          this.landingLagTimer = HARD_LANDING_LAG_TIMER;
        }
        else {
          this.landingLagTimer = SOFT_LANDING_LAG_TIMER;
        }

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

      // Start timer
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
      for (let i = this.hitboxes.length - 1; i >= 0; i--) {

        let hitbox = this.hitboxes[i];

        // Update the frame and position
        hitbox.currentFrame++;
        hitbox.update(this.position.x, this.position.y, this.direction);

        // Remove hitboxes that have ended
        if (hitbox.currentFrame > hitbox.totalFrames) {
          this.hitboxes.splice(i, 1);
          this.currentAttack = null;
        }
      }

      // State triggers
      if (this.hitboxes.length === 0) {
        this.state = "idle";
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

    // Spawning state behavior and triggers
    case "spawning":

      // State behavior
      this.angelPlatform();

      // State triggers
      if (keyIsDown(this.controls.down)) {
        this.state = "airborne";
        this.fastFalling = true;
      }

      if (keyIsDown(this.controls.left) || keyIsDown(this.controls.right) || this.angelPlatformTimer <= 0) {
        this.angelPlatformTimer = 300;
        this.state = "airborne";
      }

      break;

    // hitstun state behavior and triggers
    case "hitstun":

      // State behavior
      if (!this.invincible) {
        this.stats.color = "red";
      }

      // Count hitstun frames
      this.hitstunTimer--;

      // State triggers
      if (this.hitstunTimer <= 0) {

        // Change to airborne or idle depending on the position
        if (!this.touchingTop) {
          this.state = "airborne";
        }
        else {
          this.state = "idle";
        }
      }

      break;
    }
  }

  // Move player on the stage
  groundMovement() {

    // Move right
    if (keyIsDown(this.controls.right)) {
      this.acceleration.add(this.stats.initialDash, 0);
      this.direction = true;
    }

    // Move left
    if (keyIsDown(this.controls.left)) {
      this.acceleration.add(-this.stats.initialDash, 0);
      this.direction = false;
    }
  }

  // make the player smaller
  crouch() {
    if (keyIsDown(this.controls.down)) {
      this.stats.currentHeight = this.stats.crouchHeight;
      this.position.y += this.stats.crouchHeight;
    }
  }

  // Move player in the air
  airMovement() {

    // Move right
    if (keyIsDown(this.controls.right)) {
      this.acceleration.add(this.stats.airAcceleration, 0);
    }

    // Move left
    if (keyIsDown(this.controls.left)) {
      this.acceleration.add(-this.stats.airAcceleration, 0);
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
      if (keyIsDown(this.controls.shortHop)) {
        this.velocity.y = this.stats.shortHopPower;
      }
      else if (keyIsDown(this.controls.up)) {
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
    this.position.x = PLAYER_ONE_SPAWN_X;
    this.position.y = PLAYER_ONE_SPAWN_Y;

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
    this.currentAngle = null;

    // Frame data
    this.startingFrames = attackStartingFrames;
    this.activeFrames = attackActiveFrames;
    this.endingFrames = attackEndingFrames;
    this.totalFrames = this.startingFrames + this.activeFrames + this.endingFrames;
    this.currentFrame = 0;
  }

  // Show the hitbox for the attack
  display() {

    // Use the center to draw the hitbox
    rectMode(CENTER);
    noStroke();

    // Add a hitbox if the attack is active
    if (this.currentFrame > this.startingFrames && this.currentFrame <= this.startingFrames + this.activeFrames) {
      fill("blue");
      rect(this.x, this.y, this.w, this.h);
    } 
    else {
      noFill();
      rect(this.x, this.y, this.w, this.h);
    }
  }

  // Move the hitbox with the player
  update(playerX, playerY, playerDirection) {

    let currentOffsetX = null;

    // Determine the offset X position based off of the player's direction
    if (!playerDirection) {
      currentOffsetX = -this.offsetX;
    }
    else {
      currentOffsetX = this.offsetX;
    }

    // Determine the angle based of the player's direction
    if (!playerDirection) {
      this.currentAngle = 180 - this.angle;
    }
    else {
      this.currentAngle = -this.angle;
    }

    // Attach the hitbox to the player
    this.x = playerX + currentOffsetX;
    this.y = playerY + this.offsetY;
  }

  // Determine the angle, hitstun, and kncokback of the move
  calculateKnockback(player) {

    // Make sure that the player isn't invincible
    if (player.state !== "dead" && player.state !== "spawning" && !player.invincible) {

      player.percentage += this.damage;
      
      // Calculate knockback and hitstun
      let p = player.percentage;
      let d = this.damage;
      let w = player.stats.weight;
      let s = this.growthKnockback / 100;
      let b = this.knockback;
      let knockback = 0.05 * (((p / 10 + p * d / 20) * 200 / w + 100 * 1.4 + 18) * s + b);
      let hitstun = knockback * 0.4;

      // Calculate angle
      let radianAngle = radians(this.currentAngle);
      let knockbackAngle = p5.Vector.fromAngle(radianAngle, knockback);

      // Put the player who got hit into hitstun
      player.state = "hitstun";
      player.acceleration.add(knockbackAngle);
      player.hitstunTimer = round(hitstun);
    }
  }
}

// Create a stage
class Stage {
  constructor(stageX, stageY, stageW, stageH, blastzoneGap) {

    // Stage properties
    this.x = stageX;
    this.y = stageY;
    this.w = stageW;
    this.h = stageH;
    this.blastzone = blastzoneGap;
  }

  // Show the stage
  display() {

  }

  // Go through animation frames
  update() {

  }
}

// Setup player
function setup() {
  createCanvas(SCREEN_WIDTH, SCREEN_HEIGHT);

  // Create player 1
  playerOne = new Player(PLAYER_ONE_START_X, PLAYER_ONE_START_Y - playerOneMarthStats.currentHeight / 2, 
    playerOneMarthStats, playerOneControls);

  // Create player 2
  playerTwo = new Player(PLAYER_TWO_START_X, PLAYER_TWO_START_Y - playerTwoMarthStats.currentHeight / 2, 
    playerTwoMarthStats, playerTwoControls);

  // Create stage
  rectMode(CORNER);
  fill("white");
  rect(STAGE_X, STAGE_Y, STAGE_WIDTH, STAGE_HEIGHT);
}

// Manage players
function draw() {
  background(0);
  noStroke();

  // Draw stage
  rectMode(CORNER);
  fill("white");
  rect(STAGE_X, STAGE_Y, STAGE_WIDTH, STAGE_HEIGHT);

  // Update player states and movement
  playerOne.update(playerTwo);
  playerTwo.update(playerOne);  

  // Check for collision between players and attacks
  playerCollisions(playerOne, playerTwo);

  // Display player
  playerOne.display();
  playerTwo.display();

  // console.log(playerOne.currentAttack);
}

// Handle player input for single events
function keyPressed() {

  // PLAYER ONE CONTROLS
  // Jumping
  if (keyCode === playerOne.controls.up || keyCode === playerOne.controls.shortHop) {

    // Angel platform jump
    if (playerOne.state === "spawning") {
      playerOne.state = "airborne";
      playerOne.doubleJump();
    }

    // Ground jump
    else if (playerOne.jumpAvailable) {
      playerOne.jumpSquatting = true;
    }

    // Double jump
    else if (playerOne.doubleJumpAvailable) {
      playerOne.doubleJump();
    }
  }

  // Fast falling
  if (keyCode === playerOne.controls.down) {

    // Check that player is airborne
    if (playerOne.state === "airborne") {
      playerOne.fastFall();
    }
  }

  // Attacking
  if (keyCode === playerOne.controls.attack) {

    // Make sure the player isn't currently attacking and grounded
    if (playerOne.state === "idle") {
      playerOne.spawnHitbox();
    }
  }

  // PLAYER TWO CONTROLS
  // Jumping
  if (keyCode === playerTwo.controls.up || keyCode === playerTwo.controls.shortHop) {

    // Angel platform jump
    if (playerTwo.state === "spawning") {
      playerTwo.state = "airborne";
      playerTwo.doubleJump();
    }

    // Ground jump
    else if (playerTwo.jumpAvailable) {
      playerTwo.jumpSquatting = true;
    }

    // Double jump
    else if (playerTwo.doubleJumpAvailable) {
      playerTwo.doubleJump();
    }
  }

  // Fast falling
  if (keyCode === playerTwo.controls.down) {

    // Check that player is airborne
    if (playerTwo.state === "airborne") {
      playerTwo.fastFall();
    }
  }

  // Attacking
  if (keyCode === playerTwo.controls.attack) {

    // Make sure the player isn't currently attacking and grounded
    if (playerTwo.state === "idle") {
      playerTwo.spawnHitbox();
    }
  }
}

// Check if the players are colliding and prevent them from overlapping
function playerCollisions(playerOne, playerTwo) {
  
  // Player one edges
  let playerOneBottom = playerOne.position.y + playerOne.stats.currentHeight / 2;
  let playerOneTop = playerOne.position.y - playerOne.stats.currentHeight / 2;
  let playerOneRight = playerOne.position.x + playerOne.stats.width / 2;
  let playerOneLeft = playerOne.position.x - playerOne.stats.width / 2;

  // Player two edges
  let playerTwoBottom = playerTwo.position.y + playerTwo.stats.currentHeight / 2;
  let playerTwoTop = playerTwo.position.y - playerTwo.stats.currentHeight / 2;
  let playerTwoRight = playerTwo.position.x + playerTwo.stats.width / 2;
  let playerTwoLeft = playerTwo.position.x - playerTwo.stats.width / 2;

  // First check if there is any collision and then detect which side is the closest
  if (playerOneBottom >= playerTwoTop && playerOneTop <= playerTwoBottom && 
    playerOneRight >= playerTwoLeft && playerOneLeft <= playerTwoRight) {

    // Find the amount of overlap on the left and right
    let rightOverlap = playerTwoRight - playerOneLeft;
    let leftOverlap = playerOneRight - playerTwoLeft;

    // Find the smallest overlap
    let minimumOverlap = Math.min(rightOverlap, leftOverlap);
    
    // Push the player out to the left or right
    if (minimumOverlap === leftOverlap) {
      playerOne.position.x -= leftOverlap / 2;
      playerTwo.position.x += leftOverlap / 2;
    }
    
    else if (minimumOverlap === rightOverlap) {
      playerOne.position.x += rightOverlap / 2;
      playerTwo.position.x -= rightOverlap / 2;
    }
  }
}