/*
  Week 9 — Example 3: Adding Sound & Music

  Course: GBDA302 | Instructors: Dr. Karen Cochrane & David Han
  Date: Mar. 19, 2026

  Controls:
    A or D (Left / Right Arrow)   Horizontal movement
    W (Up Arrow)                  Jump
    Space Bar                     Attack

  Tile key:
    g = groundTile.png       (surface ground)
    d = groundTileDeep.png   (deep ground, below surface)
      = empty (no sprite)
*/

let player;
let playerImg, bgImg;
let jumpSfx, musicSfx;
let musicStarted = false;

let playerAnis = {
  idle: { row: 0, frames: 4, frameDelay: 10 },
  run: { row: 1, frames: 4, frameDelay: 3 },
  jump: { row: 2, frames: 3, frameDelay: Infinity, frame: 0 },
  attack: { row: 3, frames: 6, frameDelay: 2 },
};

let ground, groundDeep;
let groundImg, groundDeepImg;

let attacking = false; // track if the player is attacking
let attackFrameCounter = 0; // tracking attack animation

// --- TILE MAP ---
// an array that uses the tile key to create the level
let level = [
  "              ",
  "              ",
  "              ",
  "              ",
  "              ",
  "       ggg    ",
  "gggggggggggggg", // surface ground
  "dddddddddddddd", // deep ground
];

// --- LEVEL CONSTANTS ---
// camera view size
const VIEWW = 320,
  VIEWH = 180;

// tile width & height
const TILE_W = 24,
  TILE_H = 24;

// size of individual animation frames
const FRAME_W = 32,
  FRAME_H = 32;

// Y-coordinate of player start (4 tiles above the bottom)
const MAP_START_Y = VIEWH - TILE_H * 4;

// gravity
let GRAVITY = 10;

//grounded varible
let grounded = 0;

//let devMenuCheck = false;

let devMenu = {
  title: "Dev Menu",
  check: false,
  colour: "black",
  x: VIEWW / 2,
  y: VIEWH / 2,
  w: VIEWW * (2 / 3),
  h: VIEWH * (2 / 3),
  opacity: 0.7,
  text: "toggle moon gravity: Press 2",
  enabled: false,
};

let freeRoam = false;

function preload() {
  // --- IMAGES ---
  playerImg = loadImage("assets/foxSpriteSheet.png");
  bgImg = loadImage("assets/combinedBackground.png");
  groundImg = loadImage("assets/groundTile.png");
  groundDeepImg = loadImage("assets/groundTileDeep.png");

  // --- SOUND ---
  if (typeof loadSound === "function") {
    jumpSfx = loadSound("assets/sfx/jump.wav");
    musicSfx = loadSound("assets/sfx/music.wav");
  }
}

function setup() {
  // pixelated rendering with autoscaling
  new Canvas(VIEWW, VIEWH, "pixelated");

  // needed to correct an visual artifacts from attempted antialiasing
  allSprites.pixelPerfect = true;

  world.gravity.y = GRAVITY;

  // Try to start background music immediately.
  if (musicSfx) musicSfx.setLoop(true);
  startMusicIfNeeded();

  // --- TILE GROUPS ---
  ground = new Group();
  ground.physics = "static";
  ground.img = groundImg;
  ground.tile = "g";

  groundDeep = new Group();
  groundDeep.physics = "static";
  groundDeep.img = groundDeepImg;
  groundDeep.tile = "d";

  // a Tiles object creates a level based on the level map array (defined at the beginning)
  new Tiles(level, 0, 0, TILE_W, TILE_H);

  // --- PLAYER ---
  player = new Sprite(FRAME_W, MAP_START_Y, FRAME_W, FRAME_H); // create the player
  player.spriteSheet = playerImg; // use the sprite sheet
  player.rotationLock = true; // turn off rotations (player shouldn't rotate)

  // player animation parameters
  player.anis.w = FRAME_W;
  player.anis.h = FRAME_H;
  player.anis.offset.y = -4; // offset the collision box up
  player.addAnis(playerAnis); // add the player animations defined earlier
  player.ani = "idle"; // default to the idle animation
  player.w = 18; // set the width of the collsion box
  player.h = 20; // set the height of the collsion box
  player.friction = 0; // set the friciton to 0 so we don't stick to walls
  player.bounciness = 0; // set the bounciness to 0 so the player doesn't bounce

  // --- GROUND SENSOR --- for use when detecting if the player is standing on the ground
  sensor = new Sprite();
  sensor.x = player.x;
  sensor.y = player.y + player.h / 2;
  sensor.w = player.w;
  sensor.h = 2;
  sensor.mass = 0.01;
  sensor.removeColliders();
  sensor.visible = false;
  let sensorJoint = new GlueJoint(player, sensor);
  sensorJoint.visible = false;
}

function startMusicIfNeeded() {
  if (musicStarted || !musicSfx) return;

  const startLoop = () => {
    if (!musicSfx.isPlaying()) musicSfx.play();
    musicStarted = musicSfx.isPlaying();
  };

  // Some browsers require a user gesture before audio can start.
  const maybePromise = userStartAudio();
  if (maybePromise && typeof maybePromise.then === "function") {
    maybePromise.then(startLoop).catch(() => {});
  } else {
    startLoop();
  }
}

function keyPressed() {
  startMusicIfNeeded();
}

function mousePressed() {
  startMusicIfNeeded();
}

function touchStarted() {
  startMusicIfNeeded();
  return false;
}

function draw() {
  // --- BACKGROUND ---
  camera.off();
  imageMode(CORNER);
  image(bgImg, 0, 0, bgImg.width, bgImg.height);
  camera.on();
  keyPressed();

  // --- PLAYER CONTROLS ---
  // first check to see if the player is on the ground

  if (freeRoam === false) {
    grounded = sensor.overlapping(ground);
  } else {
    //grounded = ;
    console.log("floating");
  }

  // -- ATTACK INPUT --
  if (grounded && !attacking && kb.presses("space")) {
    attacking = true;
    attackFrameCounter = 0;
    player.vel.x = 0;
    player.ani.frame = 0;
    player.ani = "attack";
    player.ani.play(); // plays once to end
  }

  // -- JUMP --
  if (grounded && kb.presses("up")) {
    player.vel.y = -4;
    if (jumpSfx) jumpSfx.play();
  }

  // --- STATE MACHINE ---
  if (attacking) {
    attackFrameCounter++;
    // Attack lasts ~6 frames * frameDelay 2 = 12 cycles (adjust if needed)
    if (attackFrameCounter > 12) {
      attacking = false;
      attackFrameCounter = 0;
    }
  } else if (!grounded) {
    player.ani = "jump";
    player.ani.frame = player.vel.y < 0 ? 0 : 1;
  } else {
    player.ani = kb.pressing("left") || kb.pressing("right") ? "run" : "idle";
  }

  // --- MOVEMENT ---
  if (!attacking) {
    player.vel.x = 0;
    if (kb.pressing("left")) {
      player.vel.x = -1.5;
      player.mirror.x = true;
    } else if (kb.pressing("right")) {
      player.vel.x = 1.5;
      player.mirror.x = false;
    }
  }

  /*if (!devMenu?.enabled && window.gamePaused) {
    window.gamePaused = false;
  }
*/
  if (kb.presses("m") || kb.presses("M")) {
    //drawDevMenu();
    window.gamePaused = true;
  } else if (kb.presses("Escape")) {
    window.gamePaused = false;
  }

  if (kb.presses("2") && window.gamePaused === true) {
    if (GRAVITY === 6) {
      GRAVITY = 10;
    } else {
      GRAVITY = 6;
    }
    world.gravity.y = GRAVITY;
  }

  if (window.gamePaused === true) {
    player.vel.x = 0;
    player.vel.y = 0;
    player.ani = "idle";

    drawDevMenu();
  }

  if (window.gamePaused === true && kb.presses("1")) {
    freeRoam = true;
  } else if (kb.presses("Escape")) {
    window.gamePaused = false;
  }

  if (freeRoam === true) {
    if (GRAVITY === 6 || GRAVITY === 10) {
      GRAVITY = 0;
    } else {
      GRAVITY = GRAVITY;
    }
    world.gravity.y = GRAVITY;

    player.vel.x = 0;
    player.vel.y = 0;

    if (kb.pressing("left")) {
      player.x = player.x - 1;
      player.mirror.x = true;
      // console.log("left");
    }
    if (kb.pressing("right")) {
      //player.vel.x = 0;
      player.mirror.x = false;
      //console.log("right");
      player.x = player.x + 1;
    }
    if (kb.pressing("up")) {
      player.y = player.y - 1;
      // player.vel.y = 0;
      //console.log("up");
      //player.mirror.y = false;
    }
    if (kb.pressing("down")) {
      player.y = player.y + 1;
      // player.mirror.y = false;
      // player.vel.y = 0;
      // console.log("down");
    }

    // --- KEEP IN VIEW ---
    player.pos.x = constrain(player.pos.x, FRAME_W / 2, VIEWW - FRAME_W / 2);
    //player.pos.y = constrain(player.pos.x, FRAME_H, VIEWH - FRAME_H);

    console.log(world.gravity.y);
  }

  function drawDevMenu() {
    rectMode(CENTER, CENTER);
    fill(devMenu.colour);
    rect(devMenu.x, devMenu.y, devMenu.w, devMenu.h);
    textSize(12);
    fill("white");
    text(devMenu.title, devMenu.x * 0.35, devMenu.y * 0.5);
    text(devMenu.text, devMenu.x * 0.35, devMenu.y * 0.7);
    text("freeroam: press 1", devMenu.x * 0.35, devMenu.y * 0.9);
    text("Press 'Escape' to exit menu", devMenu.x * 0.35, devMenu.y);
  }
}
