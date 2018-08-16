import getKeyState from '../engine/keyboard';

const audioContext = new AudioContext();

const squareArray = asize => Array(asize).fill([]).map(() => Array(asize).fill(0));
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const checkMapCollision = (x, y) => gameData.map[x | 0][y | 0] === 0;
const textureUnpack = t => t.match(/.{1,8}/g).map(s => s.split('').map(n => parseInt(n, 10)));

const pointsDistance = (a, b) => Math.sqrt(((b.x - a.x) ** 2) + ((b.y - a.y) ** 2));
const vecAdd = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const vecMul = (a, scal) => ({ x: a.x * scal, y: a.y * scal });
const vecSub = (a, b) => vecAdd(a, vecMul(b, -1));
const vecDiv = (a, scal) => ({ x: a.x / scal, y: a.y / scal });
const vecLen = (a) => Math.sqrt((a.x ** 2) + (a.y ** 2));
const vecNorm = (a) => vecDiv(a, vecLen(a));
const vecRotate = (a, rad) => {
  let cs = Math.cos(rad);
  let sn = Math.sin(rad);
  return {
    x: (a.x * cs) - (a.y * sn),
    y: (a.x * sn) + (a.y * cs),
  };
};
const dirVecPoints = (from, to) => vecNorm(vecSub(to, from));

const colorToString = c => `rgb(${c.r},${c.g},${c.b})`;
const colorMul = (c, scal) => ({ r: c.r * scal, g: c.g * scal, b: c.b * scal });

const randomFloat = (min, max) => ((Math.random() * (max - min)) + min);
const randomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * ((max - min) + 1)) + min;
};
const randomDir = () => vecNorm({ x: randomFloat(-1, 1), y: randomFloat(-1, 1) });

const enemyDirTimer = () => randomInt(60 * 2, 60 * 6);
const canEnemySeePlayer = (enemy, player) => {
  if (pointsDistance(enemy.pos, player.pos) > 10) return false;

  let dirVec = dirVecPoints(enemy.pos, player.pos);
  let castPos = { ...enemy.pos };
  let hit = false;
  while (true) {
    if (pointsDistance(castPos, player.pos) <= 0.5) {
      hit = true;
      break;
    }

    if (!checkMapCollision(castPos.x, castPos.y)) break; // wall hit

    castPos = vecAdd(castPos, dirVec);
  }

  return hit;
};

const TEXTURE_SIZE = 8;
const BUFFER_WIDTH = 90;
const BUFFER_HEIGHT = 100;
const MAP_SIZE = 32;

const PLAYER_MOVE_SPEED = 0.1;
const PLAYER_ROTATE_SPEED = 0.03;

const BULLET_SPEED = 0.5;
const BULLET_LIFETIME_FRAMES = 60 * 3;
const SHOOTING_FRAME_TIMEOUT_MAX = 7;
const SHOOTING_FRAME_TIMEOUT_ENEMY_MAX = 30;
let shootingFrameTimeout = SHOOTING_FRAME_TIMEOUT_MAX;

let enemies = [];
let bullets = [];

const shootBullet = (pos, dir, ownerPlayer) => {
  bullets.push({
    sprite: 'b',
    pos: { ...pos },
    dir: { ...dir },
    lifetime: BULLET_LIFETIME_FRAMES,
    ownerPlayer,
  });
};

// TODO: DEBUG: Remove
const DEBUG_SPAWN_TIMEOUT_MAX = 60;
let debugSpawnFrameTimeout = DEBUG_SPAWN_TIMEOUT_MAX;

const testWallTexture = textureUnpack('0000000001100110011001100000000000111100011111100110011000000000');
const SPRITE_TEX = {
  e1: textureUnpack('0000000000011000001111000010010000111100010010100101101010010101'),
  b: textureUnpack('0000000000000000000000000000000000000000000110000001100000011000'),
};

const offscreen = document.createElement('canvas');
offscreen.width = BUFFER_WIDTH;
offscreen.height = BUFFER_HEIGHT;
const gl = offscreen.getContext('2d');

// 1. Pick middle tile
// 2. If wall -> regenerate map
// 3. Make flood fill
// 4. If tile was not marked as active -> set to wall
// 5. Place enemies
// 6. Place the player
const generateMap = () => {
  const celluarAutomata = () => {
    let m = squareArray(MAP_SIZE);

    const numberOfSteps = 10;
    const birthLimit = 5;
    const deathLimit = 4; // not more than 8
    const chanceToStartAlive = 0.49;

    const countNeighbours = (x, y) => {
      let count = 0;
      [-1, 0, 1].forEach(i => {
        [-1, 0, 1].forEach(j => {
          if (i === 0 && j === 0) return;

          let nx = x + i;
          let ny = y + j;

          if ((nx < 0 || ny < 0 || nx >= MAP_SIZE || ny >= MAP_SIZE) || m[nx][ny]) {
            count++;
          }
        });
      });
      return count;
    };

    // Initialization
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        m[x][y] = Math.random() < chanceToStartAlive ? 1 : 0;
      }
    }

    // Simulation step
    for (let step = 0; step < numberOfSteps; step++) {
      let newMap = squareArray(MAP_SIZE);
      for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
          let nc = countNeighbours(x, y);
          if (m[x][y]) {
            newMap[x][y] = nc < deathLimit ? 0 : 1;
          } else if (nc > birthLimit) {
            newMap[x][y] = 1;
          } else {
            newMap[x][y] = 0;
          }
        }
      }
      m = newMap;
    }

    // Make walls
    m[0] = Array(MAP_SIZE).fill(1);
    m[MAP_SIZE - 1] = Array(MAP_SIZE).fill(1);
    m.forEach(c => {
      c[0] = 1;
      c[MAP_SIZE - 1] = 1;
    });

    return m;
  };

  const removeClosedRooms = m => {
    const floodMap = squareArray(MAP_SIZE);
    const queue = [];

    floodMap[MAP_SIZE / 2][MAP_SIZE / 2] = 1;
    queue.push({ x: MAP_SIZE / 2, y: MAP_SIZE / 2 });

    const markNeighbours = ({ x, y }) => {
      [-1, 0, 1].forEach(i => {
        [-1, 0, 1].forEach(j => {
          if (i !== 0 && j !== 0) return;

          let nx = x + i;
          let ny = y + j;

          if (
            (nx >= 0 && ny >= 0 && nx < MAP_SIZE && ny < MAP_SIZE) &&
            (m[nx][ny] === 0 && floodMap[nx][ny] === 0)
          ) {
            floodMap[nx][ny] = 1;
            queue.push({ x: nx, y: ny });
          }
        });
      });
    };

    while (queue.length) markNeighbours(queue.shift());

    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (m[x][y] === 0 && floodMap[x][y] === 0) m[x][y] = 1;
      }
    }
  };

  // Map generation
  let m = celluarAutomata();

  while (m[MAP_SIZE / 2][MAP_SIZE / 2] !== 0) m = celluarAutomata();

  removeClosedRooms(m);

  let floorTiles = [];
  let playerPlaced = false;

  for (let y = 1; y < MAP_SIZE; y++) {
    for (let x = 1; x < MAP_SIZE; x++) {
      if (m[x][y] === 0) {
        if (!playerPlaced) {
          gameData.player.pos = { x: x + 0.1, y: y + 0.1 };
          playerPlaced = true;
        } else {
          floorTiles.push({ x, y });
        }
      }
    }
  }

  shuffleArray(floorTiles);

  for (let i = 0; i < 10; i++) { // Enemy amount has to be less then number of free tiles
    enemies.push({
      sprite: 'e1',
      pos: floorTiles.pop(),
      dir: randomDir(),
      changeDirTimer: enemyDirTimer(),
      life: 100,
      shootingFrameTimeout: SHOOTING_FRAME_TIMEOUT_ENEMY_MAX,
    });
  }

  return m;
};

const soundShoot = volume => {
  const oscillatorNode = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillatorNode.type = 'triangle';
  oscillatorNode.frequency.value = randomInt(90, 92);

  oscillatorNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.015);
  oscillatorNode.start();
};

window.DEBUG_minimap = true;

function update() {
  const keyState = getKeyState();

  // TODO: DEBUG: Remove this
  if (keyState.debug) window.DEBUG = true;

  const { player, plane } = gameData;

  // TODO: DEBUG: Remove minimap
  const { minimap } = gameData;
  const minimapGl = minimap.getContext('2d');
  minimapGl.imageSmoothingEnabled = false;
  minimap.style.display = window.DEBUG_minimap ? 'block' : 'none';

  // Clear buffer
  gl.fillStyle = 'black';
  gl.fillRect(0, 0, BUFFER_WIDTH, BUFFER_HEIGHT);

  // TODO: DEBUG: Remove minimap
  minimapGl.fillStyle = 'black';
  minimapGl.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

  // Update world
  enemies.forEach(e => {
    e.hit = false; // Reset
    e.shootingFrameTimeout--;

    e.changeDirTimer--;
    if (e.changeDirTimer <= 0) {
      e.dir = randomDir();
      e.changeDirTimer = enemyDirTimer();
    }

    if (!checkMapCollision(e.pos.x, e.pos.y)) {
      e.dir = vecMul(e.dir, -1);
    }

    enemies.forEach(ee => {
      if (ee === e) return;
      if (pointsDistance(e.pos, ee.pos) <= 0.5) e.dir = vecMul(e.dir, -1);
      // if (pointsDistance(dp, player.pos) <= 0.5) canMove = false; // TODO: What if enemy hits the player
    });

    if (canEnemySeePlayer(e, player)) {
      let dirToPlayer = dirVecPoints(e.pos, player.pos);
      e.dir = dirToPlayer;

      if (e.sprite === 'e1') {
        let distanceEnemyToPlayer = pointsDistance(player.pos, e.pos);
        if (distanceEnemyToPlayer <= 3) e.dir = { x: 0, y: 0 };

        if (e.shootingFrameTimeout <= 0) {
          let bulletDir = vecRotate(dirToPlayer, randomFloat(-0.2, 0.2));
          shootBullet(e.pos, bulletDir, false);
          e.shootingFrameTimeout = SHOOTING_FRAME_TIMEOUT_ENEMY_MAX;
          soundShoot(1 / Math.max(distanceEnemyToPlayer, 1));
        }
      }
    }

    // Apply calculated movement
    e.pos = vecAdd(e.pos, vecDiv(e.dir, 50));
  });

  bullets.forEach(b => {
    let d = vecAdd(b.pos, vecMul(b.dir, BULLET_SPEED));
    if (checkMapCollision(d.x, d.y)) {
      b.pos = d;
    } else {
      b.lifetime = 0;
      return;
    }

    enemies.forEach(e => {
      // Bullet hits enemy
      if (b.ownerPlayer && pointsDistance(b.pos, e.pos) < 0.5) {
        e.life -= 15;
        e.hit = true;

        let dp = vecSub(e.pos, vecMul(b.dir, -0.4));
        let canRecoil = true;
        enemies.forEach(ee => {
          if (e === ee) return;
          if (pointsDistance(dp, ee.pos) <= 0.5) canRecoil = false;
        });

        if (!checkMapCollision(dp.x, dp.y)) canRecoil = false;

        if (canRecoil) e.pos = dp;

        b.lifetime = 0;
      }
    });
  });

  // Render world
  const zBuffer = []; // for every vertical line
  const spriteOrder = [];

  for (let x = 0; x < BUFFER_WIDTH; x++) {
    const cameraX = ((2 * x) / BUFFER_WIDTH) - 1;
    const rayDirX = player.dir.x + (plane.x * cameraX);
    const rayDirY = player.dir.y + (plane.y * cameraX);

    let mapX = player.pos.x | 0;
    let mapY = player.pos.y | 0;

    // length of ray from current position to next x or y-side
    let sideDistX;
    let sideDistY;

    // length of ray from one x or y-side to next x or y-side
    const deltaDistX = Math.abs(1 / rayDirX);
    const deltaDistY = Math.abs(1 / rayDirY);
    let perpWallDist;

    // what direction to step in x or y-direction (either +1 or -1)
    let stepX;
    let stepY;

    let hit = false;
    let side; // was a NS or a EW wall hit?

    if (rayDirX < 0) {
      stepX = -1;
      sideDistX = (player.pos.x - mapX) * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = ((mapX + 1) - player.pos.x) * deltaDistX;
    }

    if (rayDirY < 0) {
      stepY = -1;
      sideDistY = (player.pos.y - mapY) * deltaDistY;
    } else {
      stepY = 1;
      sideDistY = ((mapY + 1) - player.pos.y) * deltaDistY;
    }

    // perform DDA
    while (!hit) {
      // jump to next map square, OR in x-direction, OR in y-direction
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        side = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        side = 1;
      }

      // Check if ray has hit a wall
      if (gameData.map[mapX][mapY] > 0) {
        hit = true;
      }
    }

    // Calculate distance projected on camera direction (Euclidean distance will give fisheye effect!)
    if (side === 0) {
      perpWallDist = ((mapX - player.pos.x) + ((1 - stepX) / 2)) / rayDirX;
    } else {
      perpWallDist = ((mapY - player.pos.y) + ((1 - stepY) / 2)) / rayDirY;
    }

    // Calculate height of line to draw on screen
    const lineHeight = (BUFFER_HEIGHT / perpWallDist) | 0;

    // calculate lowest and highest pixel to fill in current stripe
    let drawStart = (-lineHeight / 2) + (BUFFER_HEIGHT / 2);
    if (drawStart < 0) {
      drawStart = 0;
    }
    let drawEnd = (lineHeight / 2) + (BUFFER_HEIGHT / 2);
    if (drawEnd >= BUFFER_HEIGHT) {
      drawEnd = BUFFER_HEIGHT - 1;
    }

    drawStart |= 0;
    drawEnd |= 0;

    // calculate value of wallX
    let wallX; // where exactly the wall was hit
    if (side === 0) {
      wallX = player.pos.y + (perpWallDist * rayDirY);
    } else {
      wallX = player.pos.x + (perpWallDist * rayDirX);
    }
    wallX -= Math.floor(wallX); // This actually has to be floored, this is not int casting

    // x coordinate on the texture
    let texX = (wallX * TEXTURE_SIZE) | 0;
    if (side === 0 && rayDirX > 0) texX = TEXTURE_SIZE - texX - 1;
    if (side === 1 && rayDirY < 0) texX = TEXTURE_SIZE - texX - 1;

    // TODO: Prevent walls ever having shadeFactor = 0 (so that they don't disappear)
    let lightScale = (drawEnd - drawStart) / BUFFER_HEIGHT; // 0 to 1
    let lightBumpValue = 0.1; // TODO: REFACTOR THIS
    let shadeFactor = Math.min((((lightScale * 16) | 0) / 16) + lightBumpValue, 1);

    for (let y = drawStart; y < drawEnd; y++) {
      let d = ((y * 256) - (BUFFER_HEIGHT * 128)) + (lineHeight * 128); // 256 and 128 factors to avoid floats
      let texY = (((d * TEXTURE_SIZE) / lineHeight) / 256) | 0;

      if (!testWallTexture[texY]) continue;
      let textureShade = (0.5 + (testWallTexture[texY][texX] * 0.5));

      let color = colorMul({ r: 24, g: 200, b: 170 }, (shadeFactor * textureShade)); // TODO: Extract base color somewhere
      gl.fillStyle = colorToString(color);
      gl.fillRect(x, y, 1, 1);
    }

    zBuffer[x] = perpWallDist;
  }

  // Sprite casting
  const sprites = [].concat(enemies, bullets);

  // TODO: Try to render sprites in the bigger canvas resulting in higher quality sprites
  for (let i = 0; i < sprites.length; i++) {
    spriteOrder[i] = {
      order: i,
      distance: (((player.pos.x - sprites[i].pos.x) * (player.pos.x - sprites[i].pos.x)) + ((player.pos.y - sprites[i].pos.y) * (player.pos.y - sprites[i].pos.y))),
    };
  }

  spriteOrder.sort((a, b) => b.distance - a.distance);

  for (let i = 0; i < sprites.length; i++) {
    // translate sprite position to relative to camera
    let currentSprite = sprites[spriteOrder[i].order];
    let spriteTexture = SPRITE_TEX[currentSprite.sprite];
    let spriteX = currentSprite.pos.x - player.pos.x;
    let spriteY = currentSprite.pos.y - player.pos.y;

    // transform sprite with the inverse camera matrix
    // [ planeX   dirX ] -1                                       [ dirY      -dirX ]
    // [               ]       =  1/(planeX*dirY-dirX*planeY) *   [                 ]
    // [ planeY   dirY ]                                          [ -planeY  planeX ]

    let invDet = 1.0 / ((plane.x * player.dir.y) - (player.dir.x * plane.y)); // required for correct matrix multiplication

    let transformX = invDet * ((player.dir.y * spriteX) - (player.dir.x * spriteY));
    let transformY = invDet * ((-plane.y * spriteX) + (plane.x * spriteY)); // this is actually the depth inside the screen, that what Z is in 3D

    let spriteScreenX = ((BUFFER_WIDTH / 2) * (1 + (transformX / transformY))) | 0;

    // parameters for scaling and moving the sprites
    const uDiv = 2;
    const vDiv = 2;
    const vMove = 8;
    let vMoveScreen = (vMove / transformY) | 0;

    // calculate height of the sprite on screen
    let spriteHeight = (Math.abs(((BUFFER_HEIGHT / transformY) | 0)) / vDiv) | 0; // using "transformY" instead of the real distance prevents fisheye
    // calculate lowest and highest pixel to fill in current stripe
    let drawStartY = (((-spriteHeight / 2) + (BUFFER_HEIGHT / 2)) | 0) + vMoveScreen;
    if (drawStartY < 0) drawStartY = 0;
    let drawEndY = (((spriteHeight / 2) + (BUFFER_HEIGHT / 2)) | 0) + vMoveScreen;
    if (drawEndY >= BUFFER_HEIGHT) drawEndY = BUFFER_HEIGHT - 1;

    // calculate width of the sprite
    let spriteWidth = (Math.abs(((BUFFER_HEIGHT / transformY) | 0)) / uDiv) | 0;
    let drawStartX = ((-spriteWidth / 2) + spriteScreenX) | 0;
    if (drawStartX < 0) drawStartX = 0;
    let drawEndX = ((spriteWidth / 2) + spriteScreenX) | 0;
    if (drawEndX >= BUFFER_WIDTH) drawEndX = BUFFER_WIDTH - 1;

    let lightBumpValue = 0.4;
    let shadeFactor = Math.min((((drawEndY - drawStartY) / BUFFER_HEIGHT) + lightBumpValue), 1);

    let color = colorMul({ r: 255, g: 255, b: 14 }, shadeFactor);

    gl.fillStyle = currentSprite.hit ? 'white' : colorToString(color);

    // loop through every vertical stripe of the sprite on screen
    for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
      let texX = ((((((256 * (stripe - ((-spriteWidth / 2) + spriteScreenX))) * TEXTURE_SIZE) / spriteWidth)) | 0) / 256) | 0;

      // the conditions in the if are:
      // 1) it's in front of camera plane so you don't see things behind you
      // 2) it's on the screen (left)
      // 3) it's on the screen (right)
      // 4) ZBuffer, with perpendicular distance
      if (transformY > 0 && stripe > 0 && stripe < BUFFER_WIDTH && transformY < zBuffer[stripe]) {
        for (let y = drawStartY; y < drawEndY; y++) { // for every pixel of the current stripe
          let d = (((y - vMoveScreen) * 256) - (BUFFER_HEIGHT * 128)) + (spriteHeight * 128); // 256 and 128 factors to avoid floats
          let texY = (((d * TEXTURE_SIZE) / spriteHeight) / 256) | 0;

          if (!spriteTexture[texY]) continue;
          if (spriteTexture[texY][texX] === 1) gl.fillRect(stripe, y, 1, 1);
        }
      }
    }
  }

  // Render offscreen buffer
  const playerIsShooting = keyState.shoot && shootingFrameTimeout <= 0;
  const shakeX = playerIsShooting ? randomInt(-2, 2) : 0;
  const shakeY = playerIsShooting ? randomInt(-2, 2) : 0;

  engine.gl.drawImage(offscreen, shakeX, shakeY, 360, 400);

  // TODO: DEBUG: Remove this
  if (window.DEBUG) {
    const dict = {};
    const pixels = engine.gl.getImageData(0, 0, 360, 400).data;
    for (let i = 0; i < pixels.length; i += 4) {
      const key = colorToString({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
      if (pixels[i + 3] !== 255) throw new Error('Alpha is not 255!');
      dict[key] = true;
    }

    let colorCount = Object.keys(dict).length;
    let level = colorCount > 32 ? 'error' : 'log';
    console[level](`Distinct colors in frame: ${colorCount}`);
  }

  // Rendering end
  // Input processing
  let forwardVector = vecMul(player.dir, PLAYER_MOVE_SPEED);

  if (keyState.up) {
    let d = vecAdd(player.pos, forwardVector);
    if (checkMapCollision(d.x, player.pos.y)) player.pos.x = d.x;
    if (checkMapCollision(player.pos.x, d.y)) player.pos.y = d.y;
  }

  if (keyState.down) {
    let d = vecSub(player.pos, forwardVector);
    if (checkMapCollision(d.x, player.pos.y)) player.pos.x = d.x;
    if (checkMapCollision(player.pos.x, d.y)) player.pos.y = d.y;
  }

  let sideVector = vecMul({ x: -1 * player.dir.y, y: player.dir.x }, (PLAYER_MOVE_SPEED * 0.5));

  if (keyState.right) {
    let d = vecSub(player.pos, sideVector);
    if (checkMapCollision(d.x, player.pos.y)) player.pos.x = d.x;
    if (checkMapCollision(player.pos.x, d.y)) player.pos.y = d.y;
  }

  if (keyState.left) {
    let d = vecAdd(player.pos, sideVector);
    if (checkMapCollision(d.x, player.pos.y)) player.pos.x = d.x;
    if (checkMapCollision(player.pos.x, d.y)) player.pos.y = d.y;
  }

  // Rotate the player
  const oldDirX = player.dir.x;
  let playerRotateAmount = -keyState.rotate * PLAYER_ROTATE_SPEED * 0.15;
  player.dir.x = (player.dir.x * Math.cos(playerRotateAmount)) - (player.dir.y * Math.sin(playerRotateAmount));
  player.dir.y = (oldDirX * Math.sin(playerRotateAmount)) + (player.dir.y * Math.cos(playerRotateAmount));
  const oldPlaneX = plane.x;
  plane.x = (plane.x * Math.cos(playerRotateAmount)) - (plane.y * Math.sin(playerRotateAmount));
  plane.y = (oldPlaneX * Math.sin(playerRotateAmount)) + (plane.y * Math.cos(playerRotateAmount));

  if (playerIsShooting) {
    shootBullet(player.pos, player.dir, true);
    shootingFrameTimeout = SHOOTING_FRAME_TIMEOUT_MAX;
    soundShoot(0.75);
  }

  if (keyState.debugSpawnEnemy && debugSpawnFrameTimeout <= 0) {
    enemies.push({
      sprite: 'e1',
      pos: vecAdd(player.pos, vecMul(player.dir, 2)),
      dir: randomDir(),
      changeDirTimer: enemyDirTimer(),
      life: 100,
    });

    debugSpawnFrameTimeout = DEBUG_SPAWN_TIMEOUT_MAX;
  }

  // Process frame timers
  // TODO: Perhaps I should move this between update and render
  shootingFrameTimeout--;
  debugSpawnFrameTimeout--;

  bullets = bullets
    .map(b => ({ ...b, lifetime: b.lifetime - 1 }))
    .filter(b => b.lifetime > 0);

  enemies = enemies.filter(e => e.life > 0);

  keyState.rotate = 0;

  // TODO: DEBUG: Remove minimap
  // Draw minimap
  if (window.DEBUG_minimap) {
    minimapGl.fillStyle = 'white';
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (gameData.map[x][y] !== 0) minimapGl.fillRect(x, y, 1, 1);
      }
    }
    minimapGl.fillStyle = 'yellow';
    enemies.forEach(e => minimapGl.fillRect(e.pos.x | 0, e.pos.y | 0, 1, 1));
    minimapGl.fillStyle = 'red';
    minimapGl.fillRect(player.pos.x | 0, player.pos.y | 0, 1, 1);
  }

  window.DEBUG = false;
}

export default {
  update,
  generateMap,
};
