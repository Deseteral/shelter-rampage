// TODO: Test on Windows 10
// TODO: Host the submission on the github page

(() => {
  // Constant values
  let {
    sin, cos, floor, random, sqrt, ceil, min, max, abs,
  } = Math;

  let INTRO_TEXT = [
    'May 5th, 2143',
    '',
    'You have been sent to',
    'investigate what happened',
    'in the Shelter A142.',
    '',
    'Your task is simple -',
    'find and kill any enemy',
    'forces that occupy',
    'the shelter.',
    '',
    'Beware!',
    'That shelter is very',
    "deep and we've got",
    "no intel about what's",
    'inside it.',
  ];

  let TEXTURE_SIZE = 16;
  let BUFFER_WIDTH = 90;
  let BUFFER_HEIGHT = 100;
  let LEVEL_SIZE = 32;

  let PLAYER_MOVE_SPEED = 0.1;
  let PLAYER_ROTATE_SPEED = 0.03;
  let PLAYER_INVISIBILITY_TIMEOUT_MAX = 120;
  let PLAYER_BULLET_DAMAGE_TAKEN = 2;
  let PLAYER_MELEE_DAMAGE_TAKEN = 5;
  let PLAYER_GUN_HEAT_MAX = 10;
  let PLAYER_GUN_HEAT_RECOVER = 0.1;

  let E1_MOVE_SPEED = 0.02; // e1 is shooting enemy
  let E2_MOVE_SPEED = 0.12; // e2 is melee enemy

  let BULLET_SPEED = 0.5;
  let BULLET_LIFETIME_FRAMES = 180;
  let SHOOTING_FRAME_TIMEOUT_MAX = 7;
  let SHOOTING_FRAME_TIMEOUT_ENEMY_MAX = 30;

  let SPECIAL_REQUIRED = 4;
  let SPECIAL_TIMEOUT_MAX = 30;

  let DEFAULT_PLANE = { x: 0.52, y: -0.40 };
  let DEFAULT_PLAYER = () => ({
    dir: { x: 0.61, y: 0.79 },
    life: 100,
    gunHeat: PLAYER_GUN_HEAT_MAX,
    gunHeatBlock: 0,
  });

  let LOBBY_TIMEOUT_MAX = 100;
  // END Constant values

  // Textures
  let textureUnpack = (hexArray) => hexArray.map(h => parseInt(h, 16).toString(2).substr(1).split(''));

  let WALL_TEX = [
    textureUnpack(['10000', '11ff8', '13ffc', '17ffe', '1700e', '1700e', '1700e', '1700e', '1700e', '1700e', '1700e', '1700e', '17ffe', '13ffc', '11ff8', '10000']),
    textureUnpack(['10000', '1011e', '111b7', '13d27', '11c3f', '10e3f', '1661e', '13000', '11000', '10000', '17ffe', '1c7ff', '1c7ff', '1ffff', '17ffe', '10000']),
    textureUnpack(['1383c', '17c7e', '14c4e', '14c4e', '14c7e', '17c7e', '17c7e', '17c7e', '17c3c', '17c00', '17c3c', '17c7e', '17c6e', '17c5e', '17c7e', '1383c']),
  ];
  let SPRITE_TEX = {
    e1: textureUnpack(['10000', '10000', '103c0', '103c0', '10ff0', '10ff0', '10c30', '10c30', '10ff0', '10ff0', '130cc', '130cc', '133cc', '133cc', '1c333', '1c333']),
    e2: textureUnpack(['10000', '10000', '10000', '10000', '10c30', '10c30', '13ffc', '13ffc', '103c0', '103c0', '10ff0', '10ff0', '10000', '10000', '10000', '10000']),
    b: textureUnpack(['10000', '10000', '10000', '10000', '10000', '10000', '10000', '10000', '10000', '10000', '103c0', '103c0', '103c0', '103c0', '103c0', '103c0']),
    m: textureUnpack(['10000', '10000', '10000', '10000', '10000', '10000', '10000', '10000', '10ff0', '11e78', '11e78', '11818', '11818', '11e78', '11e78', '10ff0']),
  };
  // END Textures

  // Keyboard state
  let KEY_CODES = {
    87: 'up',
    83: 'down',
    65: 'left',
    68: 'right',
    32: 'shoot',
    70: 'special',
  };

  let keyState = {
    up: 0,
    down: 0,
    left: 0,
    right: 0,
    shoot: 0,
    special: 0,
    rotate: 0,
  };

  let event = document.addEventListener;
  event('mousemove', e => {
    keyState.rotate = e.movementX;
  });

  event('mousedown', e => {
    keyState.shoot = (e.button === 0);
  });

  event('mouseup', () => {
    keyState.shoot = 0;
  });

  event('keydown', e => {
    keyState[KEY_CODES[e.keyCode]] = 1;
  });

  event('keyup', e => {
    keyState[KEY_CODES[e.keyCode]] = 0;
  });
  // END Keyboard state

  // Prelude
  let audioContext = new AudioContext();
  let currentScene = null;
  let mainCanvas = document.getElementById('c');

  let mainGl = mainCanvas.getContext('2d');
  mainGl.imageSmoothingEnabled = 0;
  mainCanvas.onclick = () => mainCanvas.requestPointerLock();

  let offscreen = document.createElement('canvas');
  offscreen.width = offscreen.height = BUFFER_WIDTH;
  let gl = offscreen.getContext('2d');
  // END Prelude

  // Game objects
  let shootingFrameTimeout = SHOOTING_FRAME_TIMEOUT_MAX;
  let invisibilityTimeout = PLAYER_INVISIBILITY_TIMEOUT_MAX;

  let gameInitialized = 0;
  let lobbyTimeout = LOBBY_TIMEOUT_MAX;

  let transitionProgress = 0;

  let level = null;
  let score = 0;
  let levelDepth = 0;
  let enemies = [];
  let bullets = [];
  let powerups = [];
  let player = DEFAULT_PLAYER();

  let specialCounter = 0;
  let specialActive = 0;
  let specialTimeout = SPECIAL_TIMEOUT_MAX;

  let plane = { ...DEFAULT_PLANE };

  let disableClear = 0;
  // END Game objects

  // Utility functions
  let repeat = (times, cb, start = 0) => {
    for (let i = start; i < times; i++) cb(i);
  };

  let range = (from, to) => {
    let arr = [];
    for (let i = from; i <= to; i++) arr.push(i);
    return arr;
  };

  let squareArray = asize => Array(asize).fill([]).map(() => Array(asize).fill(0));
  let shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      let j = floor(random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  let checkMapCollision = (x, y) => level[x | 0][y | 0] === 0;

  let pointsDistance = (a, b) => sqrt(((b.x - a.x) ** 2) + ((b.y - a.y) ** 2));
  let vecAdd = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
  let vecMul = (a, scal) => ({ x: a.x * scal, y: a.y * scal });
  let vecSub = (a, b) => vecAdd(a, vecMul(b, -1));
  let vecDiv = (a, scal) => ({ x: a.x / scal, y: a.y / scal });
  let vecLen = (a) => sqrt((a.x ** 2) + (a.y ** 2));
  let vecNorm = (a) => vecDiv(a, vecLen(a));
  let vecRotate = (a, rad) => {
    let cs = cos(rad);
    let sn = sin(rad);
    return {
      x: (a.x * cs) - (a.y * sn),
      y: (a.x * sn) + (a.y * cs),
    };
  };
  let dirVecPoints = (from, to) => vecNorm(vecSub(to, from));

  let clearScreen = () => {
    mainGl.fillStyle = 'black';
    mainGl.fillRect(0, 0, 360, 400);
  };

  let colorToString = c => `rgb(${c.r},${c.g},${c.b})`;
  let colorMul = (c, scal) => ({ r: c.r * scal, g: c.g * scal, b: c.b * scal });
  let colorInv = (c) => ({ r: -c.r + 255, g: -c.g + 255, b: -c.b + 255 });
  let colorDarkenOnce = (c) => colorMul(c, 0.5);

  let strokeRect = (x, y, w, h, rgl) => {
    rgl.fillRect(x, (y - 1), w, 2);
    rgl.fillRect(x, y + h, w, 2);

    rgl.fillRect((x - 1), y, 2, h);
    rgl.fillRect(x + w, y, 2, h);
  };

  let randomFloat = (min, max) => ((random() * (max - min)) + min); // eslint-disable-line no-shadow
  let randomInt = (min, max) => { // eslint-disable-line no-shadow
    min = ceil(min);
    max = floor(max);
    return floor(random() * ((max - min) + 1)) + min;
  };
  let randomDir = () => vecNorm({ x: randomFloat(-1, 1), y: randomFloat(-1, 1) });

  let enemyDirTimer = () => randomInt(60 * 2, 60 * 6);
  let canEnemySeePlayer = (enemy, isPlayerShooting) => {
    if (!isPlayerShooting && (enemy.blind || invisibilityTimeout > 0 || pointsDistance(enemy.pos, player.pos) > 10)) return 0;

    let dirVec = dirVecPoints(enemy.pos, player.pos);
    let castPos = { ...enemy.pos };
    let hit = 0;
    while (1) { // eslint-disable-line no-constant-condition
      if (pointsDistance(castPos, player.pos) <= 0.5) {
        hit = 1;
        break;
      }

      if (!checkMapCollision(castPos.x, castPos.y)) break; // wall hit

      castPos = vecAdd(castPos, dirVec);
    }

    return hit;
  };

  let rotatePlayer = (amount) => {
    let oldDirX = player.dir.x;
    player.dir.x = (player.dir.x * cos(amount)) - (player.dir.y * sin(amount));
    player.dir.y = (oldDirX * sin(amount)) + (player.dir.y * cos(amount));
    let oldPlaneX = plane.x;
    plane.x = (plane.x * cos(amount)) - (plane.y * sin(amount));
    plane.y = (oldPlaneX * sin(amount)) + (plane.y * cos(amount));
  };

  let shootBullet = (pos, dir, ownerPlayer, spread) => {
    bullets.push({
      sprite: 'b',
      pos: { ...pos },
      dir: vecRotate(dir, randomFloat(-spread, spread)),
      lifetime: BULLET_LIFETIME_FRAMES,
      ownerPlayer,
    });
  };

  let makeEnemy = (type, pos) => {
    enemies.push({
      sprite: type,
      pos,
      dir: randomDir(),
      changeDirTimer: enemyDirTimer(),
      life: 100,
      shootingFrameTimeout: SHOOTING_FRAME_TIMEOUT_ENEMY_MAX,
    });
  };

  let makeMedipack = (pos) => {
    powerups.push({
      sprite: 'm',
      pos,
    });
  };

  let volumeFromDistance = distance => 1 / max(distance, 1);

  let progressOscillatorNode;

  let soundEffect = (type, frequency, volume) => {
    let oscillatorNode = new OscillatorNode(audioContext, { type, frequency });
    let gainNode = audioContext.createGain();

    oscillatorNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
    oscillatorNode.start();
    oscillatorNode.stop(audioContext.currentTime + 1);
  };

  let soundLetter = () => {
    soundEffect('sine', randomInt(10, 20), 1);
    soundEffect('sine', randomInt(100, 120), 1);
  };
  let soundShoot = distance => soundEffect('triangle', randomInt(90, 92), volumeFromDistance(distance));
  let soundHurt = () => soundEffect('sawtooth', 25, 0.75);
  let soundEnemyHit = distance => soundEffect('triangle', randomInt(148, 152), (volumeFromDistance(distance) * 2));
  let soundE2 = distance => soundEffect('sawtooth', 10 * volumeFromDistance(distance), volumeFromDistance(distance) * 3);
  // END Utility functions

  // Colors
  let ENV_COLOR;
  let OBJECT_COLOR;

  let makeColors = () => {
    ENV_COLOR = { r: randomInt(30, 255), g: randomInt(30, 255), b: randomInt(30, 255) };
    OBJECT_COLOR = colorInv(ENV_COLOR);
  };

  makeColors();
  // END Colors

  // Bake font
  let FONT_SIZE = 24;
  let FONT_GLYPH_SIZE = 48;
  let glyphsPrimary = {};
  let glyphsSecondary = {};

  let bakeFont = (color, glyphs) => {
    range(32, 126).map(a => String.fromCharCode(a))
      .forEach((letter) => {
        let c = document.createElement('canvas');
        c.width = FONT_GLYPH_SIZE;
        c.height = FONT_GLYPH_SIZE;
        let fontGl = c.getContext('2d');

        fontGl.font = `${FONT_SIZE}px monospace`;

        fontGl.fillStyle = color;
        fontGl.fillText(letter, 0, FONT_SIZE);

        // Clear antialiasing
        let pixels = fontGl.getImageData(0, 0, FONT_GLYPH_SIZE, FONT_GLYPH_SIZE).data;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] !== 0 || pixels[i + 1] !== 0 || pixels[i + 2] !== 0) {
            let idx = (i / 4) | 0;
            let x = (idx % FONT_GLYPH_SIZE) | 0;
            let y = (idx / FONT_GLYPH_SIZE) | 0;
            fontGl.fillRect(x, y, 1, 1);
          }
        }

        glyphs[letter] = c;
      });
  };

  let makeFonts = () => {
    bakeFont(colorToString(ENV_COLOR), glyphsPrimary);
    bakeFont(colorToString(OBJECT_COLOR), glyphsSecondary);
  };

  makeFonts();

  let drawTextBase = (text, x, y, glyps) => {
    text.split('').forEach((letter, idx) => {
      mainGl.drawImage(glyps[letter], (x + (idx * (FONT_SIZE - 10))), y);
    });
  };

  let drawText = (text, x, y) => {
    repeat(randomInt(2, 4), () => {
      let offx = randomInt(-2, 2);
      let offy = randomInt(-2, 2);
      drawTextBase(text, x + offx, y + offy, glyphsSecondary);
    });

    drawTextBase(text, x, y, glyphsPrimary);
  };
  // END Bake font

  // Level generator
  let generateLevel = () => {
    // 1. Pick middle tile
    // 2. If wall -> regenerate map
    // 3. Make flood fill
    // 4. If tile was not marked as active -> set to wall
    // 5. Place enemies
    // 6. Place the player
    let celluarAutomata = () => {
      let m = squareArray(LEVEL_SIZE);

      let numberOfSteps = 10;
      let birthLimit = 5;
      let deathLimit = 4;
      let chanceToStartAlive = 0.49;

      let countNeighbours = (x, y) => {
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

    let removeClosedRooms = m => {
      let floodMap = squareArray(LEVEL_SIZE);
      let queue = [];

      floodMap[LEVEL_SIZE / 2][LEVEL_SIZE / 2] = 1;
      queue.push({ x: LEVEL_SIZE / 2, y: LEVEL_SIZE / 2 });

      let markNeighbours = ({ x, y }) => {
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

    // Randomize wall variants
    repeat(LEVEL_SIZE, (y) => {
      repeat(LEVEL_SIZE, (x) => {
        if (m[x][y]) m[x][y] = randomInt(1, WALL_TEX.length);
      });
    });

    let floorTiles = [];
    let playerPlaced = 0;

    repeat(LEVEL_SIZE, (y) => {
      repeat(LEVEL_SIZE, (x) => {
        if (m[x][y] === 0) {
          if (!playerPlaced) {
            player.pos = { x: x + 0.1, y: y + 0.1 };
            playerPlaced = 1;
          } else {
            floorTiles.push({ x, y });
          }
        }
      }, 1);
    }, 1);

    shuffleArray(floorTiles);

    let getPos = () => {
      let pos = floorTiles.pop();
      while (pointsDistance(pos, player.pos) <= 15) pos = floorTiles.pop();
      return pos;
    };

    // Place medipacks
    repeat(levelDepth > 3 ? 1 : 0, () => {
      let pos = floorTiles.pop();
      makeMedipack(pos);
    });

    // Place enemies
    bullets = [];
    enemies = [];
    powerups = [];

    repeat(min(20, randomInt(2 * (levelDepth || 1), 5 * (levelDepth || 1))), () => makeEnemy('e1', getPos()));
    repeat(min(5, levelDepth), () => makeEnemy('e2', getPos()));

    return m;
  };
  // END Level generator

  let run = () => {
    if (!disableClear) {
      clearScreen();
    }

    currentScene();

    keyState.rotate = 0;

    window.requestAnimationFrame(run);
  };

  // Transition state
  let TRANSITION_STEP = 5;
  let transitionSoundStarted = 0;
  let transitionScene = (nextScene) => () => {
    disableClear = 1;

    if (!transitionSoundStarted) {
      progressOscillatorNode = new OscillatorNode(audioContext, { type: 'sine', frequency: 130 });
      progressOscillatorNode.connect(audioContext.destination);
      progressOscillatorNode.start();
    }

    transitionSoundStarted = 1;

    mainGl.fillStyle = colorToString(ENV_COLOR);

    for (let i = 0; i < 400; i += 40) {
      mainGl.fillRect(0, i, transitionProgress, 20);
    }

    for (let i = 20; i < 400; i += 40) {
      mainGl.fillRect(360 - transitionProgress, i, transitionProgress, 20);
    }

    transitionProgress += TRANSITION_STEP;

    progressOscillatorNode.frequency.value = 130 + ((transitionProgress / 360) * (261 - 130));

    if (transitionProgress > 360) {
      setTimeout(() => {
        disableClear = 0;
        transitionProgress = 0;
        progressOscillatorNode.stop();
        transitionSoundStarted = 0;
        currentScene = nextScene;
      }, 500);
    }
  };
  // END Transition state

  // Game scene
  let gameScene = () => {
    // Clear offscreen buffer
    gl.fillStyle = 'black';
    gl.fillRect(0, 0, BUFFER_WIDTH, BUFFER_HEIGHT);

    // Update world
    let playerIsShooting = keyState.shoot && (specialActive || shootingFrameTimeout <= 0) && !player.gunHeatBlock;

    enemies.forEach(e => {
      e.hit = 0; // Reset
      e.shootingFrameTimeout--;

      e.changeDirTimer--;
      if (e.changeDirTimer <= 0) {
        e.dir = randomDir();
        e.changeDirTimer = enemyDirTimer();
      }

      soundE2(pointsDistance(e.pos, player.pos));

      if (e.sprite === 'e1') {
        enemies.forEach(ee => {
          if (ee === e) return;
          if (pointsDistance(e.pos, ee.pos) <= 0.5) e.dir = vecMul(e.dir, -1);
        });
      }

      if (canEnemySeePlayer(e, playerIsShooting)) {
        let dirToPlayer = dirVecPoints(e.pos, player.pos);
        e.dir = dirToPlayer;

        if (e.sprite === 'e1') {
          let distanceEnemyToPlayer = pointsDistance(player.pos, e.pos);
          if (distanceEnemyToPlayer <= 3) {
            e.dir = vecMul(vecNorm(dirVecPoints(e.pos, player.pos)), -3);
          }

          if (e.shootingFrameTimeout <= 0) {
            shootBullet(e.pos, dirToPlayer, 0, 0.2);
            e.shootingFrameTimeout = SHOOTING_FRAME_TIMEOUT_ENEMY_MAX;
            soundShoot(distanceEnemyToPlayer);
          }
        }

        // Enemy touches player
        if (pointsDistance(e.pos, player.pos) <= 0.5) {
          if (e.sprite === 'e1') {
            e.life = 0;
          } else {
            e.dir = vecMul(e.dir, -1);
            e.blind = 1;
            setTimeout(() => { e.blind = 0; }, 5000);
          }
          player.life -= PLAYER_MELEE_DAMAGE_TAKEN;
          soundHurt();
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
          e.hit = 1;

          if (e.life <= 0 && !specialActive) specialCounter = min(SPECIAL_REQUIRED, specialCounter + 1);

          score += (((101 - player.life) * levelDepth) * (specialActive ? 2 : 1));

          let dp = vecSub(e.pos, vecMul(b.dir, -0.4));
          let canRecoil = 1;
          enemies.forEach(ee => {
            if (e === ee) return;
            if (pointsDistance(dp, ee.pos) <= 0.5) canRecoil = 0;
          });

          if (!checkMapCollision(dp.x, dp.y)) canRecoil = 0;

          if (canRecoil) e.pos = dp;

          b.lifetime = 0;

          soundEnemyHit(pointsDistance(e.pos, player.pos));
        }
      });

      // Bullet hits the player
      if (!specialActive && !b.ownerPlayer && b.lifetime > 0 && pointsDistance(b.pos, player.pos) <= 0.5) {
        player.life -= PLAYER_BULLET_DAMAGE_TAKEN;
        soundHurt();
      }
    });

    powerups.forEach(pu => {
      if (pointsDistance(pu.pos, player.pos) <= 0.5) {
        if (pu.sprite === 'm') {
          player.life = 100;
          pu.used = 1;
        }
      }
    });

    powerups = powerups.filter(pu => !pu.used);

    // Render world
    let zBuffer = [];
    let spriteOrder = [];

    for (let x = 0; x < BUFFER_WIDTH; x++) {
      let cameraX = ((2 * x) / BUFFER_WIDTH) - 1;
      let rayDirX = player.dir.x + (plane.x * cameraX);
      let rayDirY = player.dir.y + (plane.y * cameraX);

      let mapX = player.pos.x | 0;
      let mapY = player.pos.y | 0;

      let sideDistX;
      let sideDistY;

      let deltaDistX = abs(1 / rayDirX);
      let deltaDistY = abs(1 / rayDirY);
      let perpWallDist;

      let stepX;
      let stepY;

      let hit = 0;
      let side;

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

      while (!hit) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }

        if (level[mapX][mapY] > 0) {
          hit = 1;
        }
      }

      if (side === 0) {
        perpWallDist = ((mapX - player.pos.x) + ((1 - stepX) / 2)) / rayDirX;
      } else {
        perpWallDist = ((mapY - player.pos.y) + ((1 - stepY) / 2)) / rayDirY;
      }

      let lineHeight = (BUFFER_HEIGHT / perpWallDist) | 0;

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

      let wallX;
      if (side === 0) {
        wallX = player.pos.y + (perpWallDist * rayDirY);
      } else {
        wallX = player.pos.x + (perpWallDist * rayDirX);
      }
      wallX -= floor(wallX);

      let texX = (wallX * TEXTURE_SIZE) | 0;
      if (side === 0 && rayDirX > 0) texX = TEXTURE_SIZE - texX - 1;
      if (side === 1 && rayDirY < 0) texX = TEXTURE_SIZE - texX - 1;

      let lightScale = (drawEnd - drawStart) / BUFFER_HEIGHT;
      let lightBumpValue = 0.2;
      let shadeFactor = min((((lightScale * 10) | 0) / 10) + lightBumpValue, 1);

      for (let y = drawStart; y < drawEnd; y++) {
        let d = ((y * 256) - (BUFFER_HEIGHT * 128)) + (lineHeight * 128);
        let texY = (((d * TEXTURE_SIZE) / lineHeight) / 256) | 0;

        let wallTexture = WALL_TEX[level[mapX][mapY] - 1];
        if (!wallTexture[texY]) continue;
        let textureShade = min(1, (wallTexture[texY][texX] + 0.5));

        let color = colorMul(ENV_COLOR, (shadeFactor * textureShade));
        gl.fillStyle = colorToString(color);
        gl.fillRect(x, y, 1, 1);
      }

      zBuffer[x] = perpWallDist;
    }

    // Sprite casting
    let sprites = [].concat(enemies, bullets, powerups);

    for (let i = 0; i < sprites.length; i++) {
      spriteOrder[i] = {
        order: i,
        distance: (((player.pos.x - sprites[i].pos.x) * (player.pos.x - sprites[i].pos.x)) + ((player.pos.y - sprites[i].pos.y) * (player.pos.y - sprites[i].pos.y))),
      };
    }

    spriteOrder.sort((a, b) => b.distance - a.distance);

    for (let i = 0; i < sprites.length; i++) {
      let currentSprite = sprites[spriteOrder[i].order];
      let spriteTexture = SPRITE_TEX[currentSprite.sprite];
      let spriteX = currentSprite.pos.x - player.pos.x;
      let spriteY = currentSprite.pos.y - player.pos.y;

      let invDet = 1.0 / ((plane.x * player.dir.y) - (player.dir.x * plane.y));

      let transformX = invDet * ((player.dir.y * spriteX) - (player.dir.x * spriteY));
      let transformY = invDet * ((-plane.y * spriteX) + (plane.x * spriteY));

      let spriteScreenX = ((BUFFER_WIDTH / 2) * (1 + (transformX / transformY))) | 0;

      // Sprite scaling
      let uDiv = 2;
      let vDiv = 2;
      let vMove = TEXTURE_SIZE;
      let vMoveScreen = (vMove / transformY) | 0;

      let spriteHeight = (abs(((BUFFER_HEIGHT / transformY) | 0)) / vDiv) | 0;
      let drawStartY = (((-spriteHeight / 2) + (BUFFER_HEIGHT / 2)) | 0) + vMoveScreen;
      if (drawStartY < 0) drawStartY = 0;
      let drawEndY = (((spriteHeight / 2) + (BUFFER_HEIGHT / 2)) | 0) + vMoveScreen;
      if (drawEndY >= BUFFER_HEIGHT) drawEndY = BUFFER_HEIGHT - 1;

      let spriteWidth = (abs(((BUFFER_HEIGHT / transformY) | 0)) / uDiv) | 0;
      let drawStartX = ((-spriteWidth / 2) + spriteScreenX) | 0;
      if (drawStartX < 0) drawStartX = 0;
      let drawEndX = ((spriteWidth / 2) + spriteScreenX) | 0;
      if (drawEndX >= BUFFER_WIDTH) drawEndX = BUFFER_WIDTH - 1;

      let lightBumpValue = 0.4;
      let lightDistance = ((drawEndY - drawStartY) / BUFFER_HEIGHT);
      let shadeFactor = min(1, (((lightDistance * 10) | 0) / 10) + lightBumpValue);

      let color = colorMul(OBJECT_COLOR, shadeFactor);
      gl.fillStyle = currentSprite.hit ? 'white' : colorToString(color);

      for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
        let texX = ((((((256 * (stripe - ((-spriteWidth / 2) + spriteScreenX))) * TEXTURE_SIZE) / spriteWidth)) | 0) / 256) | 0;

        if (transformY > 0 && stripe > 0 && stripe < BUFFER_WIDTH && transformY < zBuffer[stripe]) {
          for (let y = drawStartY; y < drawEndY; y++) {
            let d = (((y - vMoveScreen) * 256) - (BUFFER_HEIGHT * 128)) + (spriteHeight * 128);
            let texY = (((d * TEXTURE_SIZE) / spriteHeight) / 256) | 0;

            if (!spriteTexture[texY]) continue;
            if (spriteTexture[texY][texX] === '1') {
              gl.fillRect(stripe, y, 1, 1);
            }
          }
        }
      }
    }

    // Render offscreen buffer
    let shakeX = playerIsShooting ? randomInt(-2, 2) : 0;
    let shakeY = playerIsShooting ? randomInt(-2, 2) : 0;

    mainGl.drawImage(offscreen, shakeX, shakeY, 360, 400);
    // END Render offscreen buffer

    // Render health bar
    mainGl.fillStyle = colorToString(colorDarkenOnce(OBJECT_COLOR));
    mainGl.fillRect(10, 10, 100, 10);
    mainGl.fillStyle = colorToString(OBJECT_COLOR);
    let hpBarLength = ((player.life / 100) * 100) | 0;
    mainGl.fillRect(10, 10, hpBarLength, 10);

    // Render gun heat bar
    mainGl.fillStyle = colorToString(colorDarkenOnce(OBJECT_COLOR));
    mainGl.fillRect(10, 380, 50, 10);
    mainGl.fillStyle = colorToString(OBJECT_COLOR);
    let heatBarLength = ((player.gunHeat / PLAYER_GUN_HEAT_MAX) * 50) | 0;
    mainGl.fillRect(10, 380, heatBarLength, 10);

    // Render special bar
    mainGl.fillStyle = colorToString(OBJECT_COLOR);
    repeat(4, (idx) => strokeRect(280 + (idx * 20), 370, 16, 20, mainGl));
    repeat(specialCounter, (idx) => mainGl.fillRect(280 + (idx * 20), 370, 16, 20));

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

    if (keyState.special && specialCounter === SPECIAL_REQUIRED) {
      specialActive = 1;
    }

    if (specialTimeout <= 0 && specialActive) {
      specialCounter--;
      specialTimeout = SPECIAL_TIMEOUT_MAX;
      if (specialCounter <= 0) {
        specialActive = 0;
      }
    }

    // Rotate the player
    let playerRotateAmount = -keyState.rotate * PLAYER_ROTATE_SPEED * 0.15;
    rotatePlayer(playerRotateAmount);

    // Player shooting
    if (playerIsShooting) {
      shootBullet(player.pos, player.dir, 1, 0.1);
      shootingFrameTimeout = SHOOTING_FRAME_TIMEOUT_MAX;
      if (!specialActive) player.gunHeat--;
      soundShoot(1);
    }

    // Process frame timers
    shootingFrameTimeout--;
    invisibilityTimeout--;
    specialTimeout--;

    if (player.gunHeat <= 0) player.gunHeatBlock = 1;
    if (player.gunHeatBlock && player.gunHeat >= PLAYER_GUN_HEAT_MAX) player.gunHeatBlock = 0;

    player.gunHeat = min(player.gunHeat + PLAYER_GUN_HEAT_RECOVER, PLAYER_GUN_HEAT_MAX);

    bullets = bullets
      .map(b => ({ ...b, lifetime: b.lifetime - 1 }))
      .filter(b => b.lifetime > 0);

    enemies.forEach(e => {
      if (e.life <= 0 && randomInt(0, 100) < 5) makeMedipack(e.pos);
    });
    enemies = enemies.filter(e => e.life > 0);

    if (enemies.length <= 0) {
      setTimeout(() => {
        currentScene = transitionScene(lobbyScene); // eslint-disable-line no-use-before-define
      }, 2000);
    }

    if (player.life <= 0) {
      currentScene = transitionScene(gameOverScene); // eslint-disable-line no-use-before-define
    }
  };
  // END Game scene

  // Lobby scene
  let lobbyScene = () => {
    // Game initialization
    if (!gameInitialized) {
      makeColors();
      makeFonts();

      let hp = player.life <= 0 ? 100 : player.life;
      player = DEFAULT_PLAYER();
      player.life = hp;

      specialCounter = 0;
      specialActive = 0;

      plane = { ...DEFAULT_PLANE };
      level = generateLevel();
      levelDepth++;

      gameInitialized = 1;
    }

    // Rendering score
    drawText('Shelter Rampage', 75, 20);

    if (score > 0) drawText(`Score: ${score}`, 10, 150);

    // Switching to game screen
    if (lobbyTimeout <= 0) {
      drawText('Press FIRE to continue', 10, 360);

      if (keyState.shoot) {
        gameInitialized = 0;
        lobbyTimeout = LOBBY_TIMEOUT_MAX;

        currentScene = transitionScene(gameScene);
      }
    }

    lobbyTimeout--;
  };
  // END Lobby scene

  // Game over scene
  let gameOverScene = () => {
    if (!gameInitialized) {
      let hs = localStorage.getItem('hs');
      if (score > hs || !hs) localStorage.setItem('hs', score);

      gameInitialized = 1;
    }

    drawText('Game over', 120, 10);
    drawText(`Your score is ${score}`, 10, 100);

    let clearedFloors = (levelDepth - 1);
    drawText(`You've cleared ${clearedFloors} floor${clearedFloors === 1 ? '' : 's'}`, 10, 130);
    drawText(`High score: ${localStorage.getItem('hs')}`, 10, 190);

    if (lobbyTimeout <= 0) {
      drawText('Press FIRE to continue', 10, 360);

      if (keyState.shoot) {
        score = 0;
        levelDepth = 0;
        lobbyTimeout = LOBBY_TIMEOUT_MAX;
        gameInitialized = 0;
        currentScene = transitionScene(lobbyScene);
      }
    }

    lobbyTimeout--;
  };
  // END Game over scene

  // Intro state
  let introX = 0;
  let introY = 0;
  let introDone = 0;
  let INTRO_LETTER_TIMEOUT_MAX = 8;
  let introLetterTimeout = INTRO_LETTER_TIMEOUT_MAX;

  let introScene = () => {
    if (introLetterTimeout <= 0) {
      if (keyState.shoot) {
        if (!introDone) {
          introDone = 1;
          introLetterTimeout = INTRO_LETTER_TIMEOUT_MAX;
        } else {
          disableClear = 0;
          currentScene = transitionScene(lobbyScene);
        }
      }

      if (!introDone) {
        if (introY < INTRO_TEXT.length) {
          if (introX < INTRO_TEXT[introY].length) {
            drawTextBase(INTRO_TEXT[introY][introX], 5 + (introX * 14), 10 + (introY * 22), glyphsPrimary);
            soundLetter();

            introX++;
            introLetterTimeout = randomInt(3, INTRO_LETTER_TIMEOUT_MAX);
          } else {
            introX = 0;
            introY++;
          }
        } else {
          introDone = 1;
        }
      }
    }

    if (introDone) {
      repeat(INTRO_TEXT.length, (idx) => {
        drawTextBase(INTRO_TEXT[idx], 5, 10 + (idx * 22), glyphsPrimary);
      });
    }

    introLetterTimeout--;
  };
  // END Intro state

  clearScreen();
  disableClear = 1;
  currentScene = introScene;
  run();
})();
