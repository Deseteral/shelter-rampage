// TODO: Test on Windows 10
// TODO: Make all consts - lets
// TODO: Remove all DEBUG stuff
// TODO: Find more vector operations to replace with vec* functions
// TODO: Replace true with 1, false with 0
// TODO: Replace <= with < etc.
// TODO: Replace empty arrow fn arg () with _     `() =>` to `_ =>`
// TODO: Fix license and all that
// TODO: Transition between screens

(() => {
  // Constant values
  let {
    sin, cos, floor, random, sqrt, ceil, min, max, abs,
  } = Math;

  const TEXTURE_SIZE = 8;
  const BUFFER_WIDTH = 90;
  const BUFFER_HEIGHT = 100;
  const LEVEL_SIZE = 32;

  const PLAYER_MOVE_SPEED = 0.1;
  const PLAYER_ROTATE_SPEED = 0.03;
  const PLAYER_INVISIBILITY_TIMEOUT_MAX = 2 * 60; // TODO: Precalculate that
  const PLAYER_BULLET_DAMAGE_TAKEN = 2;
  const PLAYER_MELEE_DAMAGE_TAKEN = 5;

  const E1_MOVE_SPEED = 0.02; // e1 is shooting enemy
  const E2_MOVE_SPEED = 0.12; // e2 is melee enemy

  const BULLET_SPEED = 0.5;
  const BULLET_LIFETIME_FRAMES = 60 * 3; // TODO: Precalculate that
  const SHOOTING_FRAME_TIMEOUT_MAX = 7;
  const SHOOTING_FRAME_TIMEOUT_ENEMY_MAX = 30;

  const DEFAULT_PLANE = { x: 0.52, y: -0.40 };
  const DEFAULT_PLAYER = () => ({
    dir: { x: 0.61, y: 0.79 },
    life: 100,
  });

  const ENV_COLOR = { r: 24, g: 200, b: 170 };
  const OBJECT_COLOR = { r: 255, g: 255, b: 14 };

  const LOBBY_TIMEOUT_MAX = 60 * 2; // TODO: Precalculate that

  const textureUnpack = t => t.match(/.{1,8}/g).map(s => s.split('').map(n => parseInt(n, 10)));
  const WALL_TEXTURE = textureUnpack('0000000001100110011001100000000000111100011111100110011000000000');
  const SPRITE_TEX = {
    e1: textureUnpack('0000000000011000001111000010010000111100010010100101101010010101'),
    e2: textureUnpack('0000000000000000001001000111111000011000001111000000000000000000'),
    b: textureUnpack('0000000000000000000000000000000000000000000110000001100000011000'),
  };
  // END Constant values

  // Keyboard state
  let KEY_CODES = {
    87: 'up',
    83: 'down',
    65: 'left',
    68: 'right',
    32: 'shoot',
    191: 'debug',
  };

  let keyState = {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
    debug: false,
    rotate: 0,
  };

  // TODO: This could use some simplifying
  document.addEventListener('mousemove', e => {
    keyState.rotate = e.movementX;
  });

  document.addEventListener('mousedown', e => {
    keyState.shoot = (e.button === 0);
  });

  document.addEventListener('mouseup', () => {
    keyState.shoot = false;
  });

  document.addEventListener('keydown', e => {
    keyState[KEY_CODES[e.keyCode]] = true;
  });

  document.addEventListener('keyup', e => {
    keyState[KEY_CODES[e.keyCode]] = false;
  });
  // END Keyboard state

  // Prelude
  let audioContext = new AudioContext();
  let currentScene = null;
  let mainCanvas = document.getElementById('c');

  let mainGl = mainCanvas.getContext('2d');
  mainGl.imageSmoothingEnabled = false;
  mainCanvas.onclick = () => mainCanvas.requestPointerLock(); // TODO: Could I get rid of `() =>`?

  const offscreen = document.createElement('canvas');
  offscreen.width = BUFFER_WIDTH;
  offscreen.height = BUFFER_HEIGHT;
  const gl = offscreen.getContext('2d');
  // END Prelude

  // Game objects
  let shootingFrameTimeout = SHOOTING_FRAME_TIMEOUT_MAX;
  let invisibilityTimeout = PLAYER_INVISIBILITY_TIMEOUT_MAX;

  let gameInitialized = false;
  let lobbyTimeout = LOBBY_TIMEOUT_MAX;

  let level = null;
  let score = 0;
  let levelDepth = 0;
  let enemies = [];
  let bullets = [];
  let player = DEFAULT_PLAYER();
  let plane = { ...DEFAULT_PLANE };
  // END Game objects

  // Utility functions
  const repeat = (times, cb, start = 0) => {
    for (let i = start; i < times; i++) cb(i);
  };

  const range = (from, to) => {
    const arr = [];
    for (let i = from; i <= to; i++) arr.push(i);
    return arr;
  };

  const squareArray = asize => Array(asize).fill([]).map(() => Array(asize).fill(0));
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = floor(random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  const checkMapCollision = (x, y) => level[x | 0][y | 0] === 0;

  const pointsDistance = (a, b) => sqrt(((b.x - a.x) ** 2) + ((b.y - a.y) ** 2));
  const vecAdd = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
  const vecMul = (a, scal) => ({ x: a.x * scal, y: a.y * scal });
  const vecSub = (a, b) => vecAdd(a, vecMul(b, -1));
  const vecDiv = (a, scal) => ({ x: a.x / scal, y: a.y / scal });
  const vecLen = (a) => sqrt((a.x ** 2) + (a.y ** 2));
  const vecNorm = (a) => vecDiv(a, vecLen(a));
  const vecRotate = (a, rad) => {
    let cs = cos(rad);
    let sn = sin(rad);
    return {
      x: (a.x * cs) - (a.y * sn),
      y: (a.x * sn) + (a.y * cs),
    };
  };
  const dirVecPoints = (from, to) => vecNorm(vecSub(to, from));

  const colorToString = c => `rgb(${c.r},${c.g},${c.b})`;
  const colorMul = (c, scal) => ({ r: c.r * scal, g: c.g * scal, b: c.b * scal });

  const randomFloat = (min, max) => ((random() * (max - min)) + min); // eslint-disable-line no-shadow
  const randomInt = (min, max) => { // eslint-disable-line no-shadow
    min = ceil(min);
    max = floor(max);
    return floor(random() * ((max - min) + 1)) + min;
  };
  const randomDir = () => vecNorm({ x: randomFloat(-1, 1), y: randomFloat(-1, 1) });

  const enemyDirTimer = () => randomInt(60 * 2, 60 * 6);
  const canEnemySeePlayer = (enemy) => {
    if (invisibilityTimeout > 0 || pointsDistance(enemy.pos, player.pos) > 10) return false;

    let dirVec = dirVecPoints(enemy.pos, player.pos);
    let castPos = { ...enemy.pos };
    let hit = false;
    while (true) { // eslint-disable-line no-constant-condition
      if (pointsDistance(castPos, player.pos) <= 0.5) {
        hit = true;
        break;
      }

      if (!checkMapCollision(castPos.x, castPos.y)) break; // wall hit

      castPos = vecAdd(castPos, dirVec);
    }

    return hit;
  };

  const rotatePlayer = (amount) => {
    const oldDirX = player.dir.x;
    player.dir.x = (player.dir.x * cos(amount)) - (player.dir.y * sin(amount));
    player.dir.y = (oldDirX * sin(amount)) + (player.dir.y * cos(amount));
    const oldPlaneX = plane.x;
    plane.x = (plane.x * cos(amount)) - (plane.y * sin(amount));
    plane.y = (oldPlaneX * sin(amount)) + (plane.y * cos(amount));
  };

  const shootBullet = (pos, dir, ownerPlayer) => {
    bullets.push({
      sprite: 'b',
      pos: { ...pos },
      dir: { ...dir },
      lifetime: BULLET_LIFETIME_FRAMES,
      ownerPlayer,
    });
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
  // END Utility functions

  // Bake font
  const FONT_SIZE = 24;
  const FONT_GLYPH_SIZE = 2 * FONT_SIZE; // TODO: Precalc that
  const whiteFontGlyphs = {};

  const bakeFont = (color, glyphs) => {
    range(32, 126).map(a => String.fromCharCode(a))
      .forEach((letter) => {
        const c = document.createElement('canvas');
        c.width = FONT_GLYPH_SIZE;
        c.height = FONT_GLYPH_SIZE;
        const fontGl = c.getContext('2d');

        fontGl.font = `${FONT_SIZE}px monospace`;

        fontGl.fillStyle = color;
        fontGl.fillText(letter, 0, FONT_SIZE);

        // Clear antialiasing
        const pixels = fontGl.getImageData(0, 0, FONT_GLYPH_SIZE, FONT_GLYPH_SIZE).data;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] !== 0 || pixels[i + 1] !== 0 || pixels[i + 2] !== 0) {
            const idx = (i / 4) | 0;
            const x = (idx % FONT_GLYPH_SIZE) | 0;
            const y = (idx / FONT_GLYPH_SIZE) | 0;
            fontGl.fillRect(x, y, 1, 1);
          }
        }

        glyphs[letter] = c;
      });
  };

  bakeFont('white', whiteFontGlyphs);

  const drawText = (text, x, y, glyphs = whiteFontGlyphs) => {
    text
      .split('')
      .forEach((letter, idx) => {
        mainGl.drawImage(glyphs[letter], (x + (idx * (FONT_SIZE - 10))), y);
      });
  };
  // END Bake font

  // Level generator
  const generateLevel = () => {
    // 1. Pick middle tile
    // 2. If wall -> regenerate map
    // 3. Make flood fill
    // 4. If tile was not marked as active -> set to wall
    // 5. Place enemies
    // 6. Place the player
    const celluarAutomata = () => {
      let m = squareArray(LEVEL_SIZE);

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

            if ((nx < 0 || ny < 0 || nx >= LEVEL_SIZE || ny >= LEVEL_SIZE) || m[nx][ny]) {
              count++;
            }
          });
        });
        return count;
      };

      // Initialization
      repeat(LEVEL_SIZE, (y) => {
        repeat(LEVEL_SIZE, (x) => {
          m[x][y] = random() < chanceToStartAlive ? 1 : 0;
        });
      });

      // Simulation step
      repeat(numberOfSteps, () => {
        let newMap = squareArray(LEVEL_SIZE);
        repeat(LEVEL_SIZE, (y) => {
          repeat(LEVEL_SIZE, (x) => {
            let nc = countNeighbours(x, y);
            if (m[x][y]) {
              newMap[x][y] = nc < deathLimit ? 0 : 1;
            } else if (nc > birthLimit) {
              newMap[x][y] = 1;
            } else {
              newMap[x][y] = 0;
            }
          });
        });
        m = newMap;
      });

      // Make walls
      m[0] = Array(LEVEL_SIZE).fill(1);
      m[LEVEL_SIZE - 1] = Array(LEVEL_SIZE).fill(1);
      m.forEach(c => {
        c[0] = 1;
        c[LEVEL_SIZE - 1] = 1;
      });

      return m;
    };

    const removeClosedRooms = m => {
      const floodMap = squareArray(LEVEL_SIZE);
      const queue = [];

      floodMap[LEVEL_SIZE / 2][LEVEL_SIZE / 2] = 1;
      queue.push({ x: LEVEL_SIZE / 2, y: LEVEL_SIZE / 2 });

      const markNeighbours = ({ x, y }) => {
        [-1, 0, 1].forEach(i => {
          [-1, 0, 1].forEach(j => {
            if (i !== 0 && j !== 0) return;

            let nx = x + i;
            let ny = y + j;

            if (
              (nx >= 0 && ny >= 0 && nx < LEVEL_SIZE && ny < LEVEL_SIZE) &&
              (m[nx][ny] === 0 && floodMap[nx][ny] === 0)
            ) {
              floodMap[nx][ny] = 1;
              queue.push({ x: nx, y: ny });
            }
          });
        });
      };

      while (queue.length) markNeighbours(queue.shift());

      repeat(LEVEL_SIZE, (y) => {
        repeat(LEVEL_SIZE, (x) => {
          if (m[x][y] === 0 && floodMap[x][y] === 0) m[x][y] = 1;
        });
      });
    };

    // Map generation
    let m = celluarAutomata();

    while (m[LEVEL_SIZE / 2][LEVEL_SIZE / 2] !== 0) m = celluarAutomata();

    removeClosedRooms(m);

    let floorTiles = [];
    let playerPlaced = false;

    repeat(LEVEL_SIZE, (y) => {
      repeat(LEVEL_SIZE, (x) => {
        if (m[x][y] === 0) {
          if (!playerPlaced) {
            player.pos = { x: x + 0.1, y: y + 0.1 };
            playerPlaced = true;
          } else {
            floorTiles.push({ x, y });
          }
        }
      }, 1);
    }, 1);

    shuffleArray(floorTiles);

    const getPos = () => {
      let pos = floorTiles.pop();
      while (pointsDistance(pos, player.pos) <= 15) pos = floorTiles.pop();
      return pos;
    };

    repeat(10, () => { // Enemy amount has to be less then number of free tiles
      enemies.push({
        sprite: 'e1',
        pos: getPos(),
        dir: randomDir(),
        changeDirTimer: enemyDirTimer(),
        life: 100,
        shootingFrameTimeout: SHOOTING_FRAME_TIMEOUT_ENEMY_MAX,
      });
    });

    repeat(10, () => {
      enemies.push({
        sprite: 'e2',
        pos: getPos(),
        dir: randomDir(),
        changeDirTimer: enemyDirTimer(),
        life: 50,
        shootingFrameTimeout: SHOOTING_FRAME_TIMEOUT_ENEMY_MAX,
      });
    });

    return m;
  };
  // END Level generator

  // TODO: DEBUG: Remove minimap
  // {
  //   const minimap = document.createElement('canvas');
  //   minimap.id = 'minimap';
  //   minimap.width = 32;
  //   minimap.height = 32;
  //   minimap.style.position = 'absolute';
  //   minimap.style.width = '256px';
  //   minimap.style['image-rendering'] = 'pixelated';
  //   document.body.insertBefore(minimap, document.body.firstChild);
  //   gameData.minimap = minimap;
  // }

  let run = () => {
    if (keyState.debug) window.DEBUG = true; // TODO: DEBUG: Remove debug

    mainGl.fillStyle = 'black';
    mainGl.fillRect(0, 0, 360, 400);

    currentScene();

    if (window.DEBUG) { // TODO: DEBUG: Remove color counting
      const dict = {};
      const pixels = mainGl.getImageData(0, 0, 360, 400).data;
      for (let i = 0; i < pixels.length; i += 4) {
        const key = colorToString({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
        if (pixels[i + 3] !== 255) throw new Error('Alpha is not 255!');
        dict[key] = true;
      }

      let colorCount = Object.keys(dict).length;
      let logLevel = colorCount > 32 ? 'error' : 'log';
      console[logLevel](`Distinct colors in frame: ${colorCount}`);
    }

    keyState.rotate = 0;

    window.DEBUG = false; // TODO: DEBUG: Remove debug

    window.requestAnimationFrame(run); // TODO: Could I get rid of window. ?
  };

  // Game scene
  let gameScene = () => {
    // TODO: DEBUG: Remove minimap
    // const { minimap } = gameData;
    // const minimapGl = minimap.getContext('2d');
    // minimapGl.imageSmoothingEnabled = false;
    // minimap.style.display = window.DEBUG_minimap ? 'block' : 'none';

    // Clear offscreen buffer
    gl.fillStyle = 'black';
    gl.fillRect(0, 0, BUFFER_WIDTH, BUFFER_HEIGHT);

    // TODO: DEBUG: Remove minimap
    // minimapGl.fillStyle = 'black';
    // minimapGl.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    // Update world
    enemies.forEach(e => {
      e.hit = false; // Reset
      e.shootingFrameTimeout--;

      e.changeDirTimer--;
      if (e.changeDirTimer <= 0) {
        e.dir = randomDir();
        e.changeDirTimer = enemyDirTimer();
      }

      enemies.forEach(ee => {
        if (ee === e) return;
        if (pointsDistance(e.pos, ee.pos) <= 0.5) e.dir = vecMul(e.dir, -1);
      });

      if (canEnemySeePlayer(e, player)) {
        let dirToPlayer = dirVecPoints(e.pos, player.pos);
        e.dir = dirToPlayer;

        if (e.sprite === 'e1') {
          let distanceEnemyToPlayer = pointsDistance(player.pos, e.pos);
          if (distanceEnemyToPlayer <= 3) {
            e.dir = vecMul(vecNorm(dirVecPoints(e.pos, player.pos)), -3);
          }

          if (e.shootingFrameTimeout <= 0) {
            let bulletDir = vecRotate(dirToPlayer, randomFloat(-0.2, 0.2));
            shootBullet(e.pos, bulletDir, false);
            e.shootingFrameTimeout = SHOOTING_FRAME_TIMEOUT_ENEMY_MAX;
            soundShoot(1 / max(distanceEnemyToPlayer, 1));
          }
        }

        // Enemy touches player
        if (pointsDistance(e.pos, player.pos) <= 0.5) {
          e.life = 0;
          player.life -= PLAYER_MELEE_DAMAGE_TAKEN;
        }
      }

      // Apply calculated movement
      let makeDp = () => vecAdd(e.pos, vecMul(e.dir, e.sprite === 'e1' ? E1_MOVE_SPEED : E2_MOVE_SPEED));
      let dp = makeDp();
      if (checkMapCollision(dp.x, dp.y)) {
        e.pos = dp;
      } else {
        e.dir = vecMul(e.dir, -1);
        e.pos = makeDp();
      }
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

          score += 15;

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

      // Bullet hits the player
      if (!b.ownerPlayer && b.lifetime > 0 && pointsDistance(b.pos, player.pos) <= 0.5) {
        player.life -= PLAYER_BULLET_DAMAGE_TAKEN;
      }
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
      const deltaDistX = abs(1 / rayDirX);
      const deltaDistY = abs(1 / rayDirY);
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
        if (level[mapX][mapY] > 0) {
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
      wallX -= floor(wallX); // This actually has to be floored, this is not int casting

      // x coordinate on the texture
      let texX = (wallX * TEXTURE_SIZE) | 0;
      if (side === 0 && rayDirX > 0) texX = TEXTURE_SIZE - texX - 1;
      if (side === 1 && rayDirY < 0) texX = TEXTURE_SIZE - texX - 1;

      let lightScale = (drawEnd - drawStart) / BUFFER_HEIGHT; // 0 to 1
      let lightBumpValue = 0.1;
      let shadeFactor = min((((lightScale * 10) | 0) / 10) + lightBumpValue, 1);

      for (let y = drawStart; y < drawEnd; y++) {
        let d = ((y * 256) - (BUFFER_HEIGHT * 128)) + (lineHeight * 128); // 256 and 128 factors to avoid floats
        let texY = (((d * TEXTURE_SIZE) / lineHeight) / 256) | 0;

        if (!WALL_TEXTURE[texY]) continue;
        let textureShade = min(1, (WALL_TEXTURE[texY][texX] + 0.5));

        let color = colorMul(ENV_COLOR, (shadeFactor * textureShade));
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
      let spriteHeight = (abs(((BUFFER_HEIGHT / transformY) | 0)) / vDiv) | 0; // using "transformY" instead of the real distance prevents fisheye
      // calculate lowest and highest pixel to fill in current stripe
      let drawStartY = (((-spriteHeight / 2) + (BUFFER_HEIGHT / 2)) | 0) + vMoveScreen;
      if (drawStartY < 0) drawStartY = 0;
      let drawEndY = (((spriteHeight / 2) + (BUFFER_HEIGHT / 2)) | 0) + vMoveScreen;
      if (drawEndY >= BUFFER_HEIGHT) drawEndY = BUFFER_HEIGHT - 1;

      // calculate width of the sprite
      let spriteWidth = (abs(((BUFFER_HEIGHT / transformY) | 0)) / uDiv) | 0;
      let drawStartX = ((-spriteWidth / 2) + spriteScreenX) | 0;
      if (drawStartX < 0) drawStartX = 0;
      let drawEndX = ((spriteWidth / 2) + spriteScreenX) | 0;
      if (drawEndX >= BUFFER_WIDTH) drawEndX = BUFFER_WIDTH - 1;

      let lightBumpValue = 0.4;
      let lightDistance = ((drawEndY - drawStartY) / BUFFER_HEIGHT); // from 0 to 1
      let shadeFactor = min(1, (((lightDistance * 10) | 0) / 10) + lightBumpValue);

      let color = colorMul(OBJECT_COLOR, shadeFactor);

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

    mainGl.drawImage(offscreen, shakeX, shakeY, 360, 400);
    // END Render offscreen buffer

    // Render health bar
    mainGl.fillStyle = colorToString(OBJECT_COLOR);
    const hpBarLength = ((player.life / 100) * 100) | 0;
    mainGl.fillRect(10, 10, hpBarLength, 10); // TODO: Render background for the hp bar

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
    let playerRotateAmount = -keyState.rotate * PLAYER_ROTATE_SPEED * 0.15;
    rotatePlayer(playerRotateAmount);

    // Player shooting
    if (playerIsShooting) {
      shootBullet(player.pos, player.dir, true);
      shootingFrameTimeout = SHOOTING_FRAME_TIMEOUT_MAX;
      soundShoot(0.75);
    }

    // Process frame timers
    // TODO: Perhaps I should move this between update and render
    shootingFrameTimeout--;
    invisibilityTimeout--;

    bullets = bullets
      .map(b => ({ ...b, lifetime: b.lifetime - 1 }))
      .filter(b => b.lifetime > 0);

    enemies = enemies.filter(e => e.life > 0);

    if (enemies.length <= 0) {
      currentScene = lobbyScene; // eslint-disable-line no-use-before-define
    }

    if (player.life <= 0) {
      currentScene = gameOverScene; // eslint-disable-line no-use-before-define
    }

    // TODO: DEBUG: Remove minimap
    // Draw minimap
    // if (window.DEBUG_minimap) {
    //   minimapGl.fillStyle = 'white';
    //   for (let y = 0; y < MAP_SIZE; y++) {
    //     for (let x = 0; x < MAP_SIZE; x++) {
    //       if (gameData.map[x][y] !== 0) minimapGl.fillRect(x, y, 1, 1);
    //     }
    //   }
    //   minimapGl.fillStyle = 'yellow';
    //   enemies.forEach(e => minimapGl.fillRect(e.pos.x | 0, e.pos.y | 0, 1, 1));
    //   minimapGl.fillStyle = 'red';
    //   minimapGl.fillRect(player.pos.x | 0, player.pos.y | 0, 1, 1);
    // }
  };
  // END Game scene

  // Lobby scene
  let lobbyScene = () => {
    // Game initialization
    if (!gameInitialized) {
      player = DEFAULT_PLAYER();
      plane = { ...DEFAULT_PLANE };
      level = generateLevel();
      levelDepth++;

      const hs = localStorage.getItem('hs');
      if (score > hs || !hs) localStorage.setItem('hs', score);

      gameInitialized = true;
    }

    // Rendering score
    const hs = localStorage.getItem('hs');
    drawText('31337 game', 10, 100);
    drawText(`Score: ${score}`, 20, 128);
    drawText(`High score: ${hs}`, 20, 152);

    // Switching to game screen
    if (lobbyTimeout <= 0) {
      drawText('Press FIRE to continue', 10, 300);

      if (keyState.shoot) {
        gameInitialized = false;
        lobbyTimeout = LOBBY_TIMEOUT_MAX;

        currentScene = gameScene;
      }
    }

    lobbyTimeout--;
  };
  // END Lobby scene

  // Game over scene
  let gameOverScene = () => {
    drawText('Game over', 10, 10);
    drawText(`Your score is ${score}`, 10, 100);

    const clearedFloors = (levelDepth - 1);
    drawText(`You've cleared ${clearedFloors} floor${clearedFloors === 1 ? '' : 's'}`, 10, 130);

    if (lobbyTimeout <= 0) {
      drawText('Press FIRE to continue', 10, 300);

      if (keyState.shoot) {
        lobbyTimeout = LOBBY_TIMEOUT_MAX;
        currentScene = lobbyScene;
      }
    }

    lobbyTimeout--;
  };
  // END Game over scene

  currentScene = lobbyScene;
  run(); // TODO: Put this at the very end
})();
