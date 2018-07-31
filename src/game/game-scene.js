import getKeyState from '../engine/keyboard';

// TODO: Remove this
function DEBUG_TIME(name) {
  if (window.DEBUG) console.time(name);
}

// TODO: Remove this
function DEBUG_TIME_END(name) {
  if (window.DEBUG) console.timeEnd(name);
}

// const MAP = [
//   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 2, 2, 0, 2, 2, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 4, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 4, 0, 0, 0, 0, 5, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 4, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 4, 0, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
//   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
// ];

const colorToString = c => `rgb(${c.r},${c.g},${c.b})`;
const checkMapCollision = (x, y) => MAP[x | 0][y | 0] === 0;
const textureUnpack = t => t.match(/.{1,8}/g).map(s => s.split('').map(n => parseInt(n, 10)));

const textureSize = 8;
const bufferWidth = 90;
const bufferHeight = 100;
const playerMoveSpeed = 0.1;
const playerRotateSpeed = 0.03;

const TEX = textureUnpack('0000000001100110011001100000000000111100011111100110011000000000');
const SPRITE_TEX = textureUnpack('0000000000011000001111000010010000111100010010100101101010010101');

const enemies = [
  { x: 14, y: 12 },
  { x: 10, y: 15 },
  { x: 21.5, y: 8 },
  { x: 13, y: 13 },
];

const zBuffer = []; // for every vertical line
const spriteOrder = [];

const offscreen = document.createElement('canvas');
offscreen.width = bufferWidth;
offscreen.height = bufferHeight;
const gl = offscreen.getContext('2d');

const generateMap = () => {
  const size = 64;
  const newArray = () => Array(size).fill([]).map(() => Array(size).fill(0));
  let m = newArray();

  const numberOfSteps = 1;
  const birthLimit = 2;
  const deathLimit = 4;
  const chanceToStartAlive = 0.5;

  const countNeighbours = (x, y) => {
    let count = 0;
    [-1, 1].forEach(i => {
      [-1, 1].forEach(j => {
        let nx = x + i;
        let ny = y + j;

        if ((nx < 0 || ny < 0 || nx >= size || ny >= size) || m[nx][ny]) {
          count++;
        }
      });
    });
    return count;
  };

  // Initialization
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      m[x][y] = Math.random() < chanceToStartAlive ? 1 : 0;
    }
  }

  // Simulation step
  for (let step = 0; step < numberOfSteps; step++) {
    let newMap = newArray();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
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

  // Clear single neighbours
  // for (let y = 0; y < size; y++) {
  //   for (let x = 0; x < size; x++) {
  //     let nc = countNeighbours(x, y);
  //     if (nc === 1) m[x][y] = 0;
  //   }
  // }

  // Make walls
  m[0] = Array(size).fill(1);
  m[size - 1] = Array(size).fill(1);
  m.forEach(c => {
    c[0] = 1;
    c[size - 1] = 1;
  });

  return m;
};

const MAP = generateMap();

// DEBUG: Map overview log
console.log(MAP.map(a => a.map(s => (s ? '#' : ' ')).join('')).join('\n'));

function update() {
  DEBUG_TIME('update');

  const { pos, dir, plane } = gameData;

  // Clear buffer
  gl.fillStyle = 'black';
  gl.fillRect(0, 0, bufferWidth, bufferHeight);

  // Render world
  for (let x = 0; x < bufferWidth; x++) {
    const cameraX = ((2 * x) / bufferWidth) - 1;
    const rayDirX = dir.x + (plane.x * cameraX);
    const rayDirY = dir.y + (plane.y * cameraX);

    let mapX = pos.x | 0;
    let mapY = pos.y | 0;

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
      sideDistX = (pos.x - mapX) * deltaDistX;
    } else {
      stepX = 1;
      sideDistX = ((mapX + 1) - pos.x) * deltaDistX;
    }

    if (rayDirY < 0) {
      stepY = -1;
      sideDistY = (pos.y - mapY) * deltaDistY;
    } else {
      stepY = 1;
      sideDistY = ((mapY + 1) - pos.y) * deltaDistY;
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
      // if (!MAP[mapX]) {
      //   hit = true;
      //   continue;
      // }
      if (MAP[mapX][mapY] > 0) {
        hit = true;
      }
    }

    // Calculate distance projected on camera direction (Euclidean distance will give fisheye effect!)
    if (side === 0) {
      perpWallDist = ((mapX - pos.x) + ((1 - stepX) / 2)) / rayDirX;
    } else {
      perpWallDist = ((mapY - pos.y) + ((1 - stepY) / 2)) / rayDirY;
    }

    // Calculate height of line to draw on screen
    const lineHeight = (bufferHeight / perpWallDist) | 0;

    // calculate lowest and highest pixel to fill in current stripe
    let drawStart = (-lineHeight / 2) + (bufferHeight / 2);
    if (drawStart < 0) {
      drawStart = 0;
    }
    let drawEnd = (lineHeight / 2) + (bufferHeight / 2);
    if (drawEnd >= bufferHeight) {
      drawEnd = bufferHeight - 1;
    }

    drawStart |= 0;
    drawEnd |= 0;

    // calculate value of wallX
    let wallX; // where exactly the wall was hit
    if (side === 0) {
      wallX = pos.y + (perpWallDist * rayDirY);
    } else {
      wallX = pos.x + (perpWallDist * rayDirX);
    }
    wallX -= Math.floor(wallX); // This actually has to be floored, this is not int casting

    // x coordinate on the texture
    let texX = (wallX * textureSize) | 0;
    if (side === 0 && rayDirX > 0) texX = textureSize - texX - 1;
    if (side === 1 && rayDirY < 0) texX = textureSize - texX - 1;

    // TODO: Prevent walls ever having shadeFactor = 0 (so that they don't disappear)
    let lightScale = (drawEnd - drawStart) / bufferHeight; // 0 to 1
    let lightBumpValue = 0.1; // TODO: REFACTOR THIS
    let shadeFactor = Math.min((((lightScale * 16) | 0) / 16) + lightBumpValue, 1);

    for (let y = drawStart; y < drawEnd; y++) {
      let d = ((y * 256) - (bufferHeight * 128)) + (lineHeight * 128); // 256 and 128 factors to avoid floats
      let texY = (((d * textureSize) / lineHeight) / 256) | 0;
      if (!TEX[texY]) continue;
      let textureShade = (0.5 + (TEX[texY][texX] * 0.5));
      // make color darker for y-sides: R, G and B byte each divided through two with a "shift" and an "and"
      // if (side == 1) color = (color >> 1) & 8355711;

      let color = {
        r: 24 * shadeFactor * textureShade,
        g: 200 * shadeFactor * textureShade,
        b: 170 * shadeFactor * textureShade,
      };
      gl.fillStyle = colorToString(color);
      gl.fillRect(x, y, 1, 1);
    }

    zBuffer[x] = perpWallDist;
  }

  // Sprite casting
  const sprites = [].concat(enemies);

  // TODO: Try to render sprites in the bigger canvas resulting in higher quality sprites
  for (let i = 0; i < sprites.length; i++) {
    spriteOrder[i] = {
      order: i,
      distance: (((pos.x - sprites[i].x) * (pos.x - sprites[i].x)) + ((pos.y - sprites[i].y) * (pos.y - sprites[i].y))),
    };
  }

  spriteOrder.sort((a, b) => b.distance - a.distance);

  for (let i = 0; i < sprites.length; i++) {
    // translate sprite position to relative to camera
    let spriteX = sprites[spriteOrder[i].order].x - pos.x;
    let spriteY = sprites[spriteOrder[i].order].y - pos.y;

    // transform sprite with the inverse camera matrix
    // [ planeX   dirX ] -1                                       [ dirY      -dirX ]
    // [               ]       =  1/(planeX*dirY-dirX*planeY) *   [                 ]
    // [ planeY   dirY ]                                          [ -planeY  planeX ]

    let invDet = 1.0 / ((plane.x * dir.y) - (dir.x * plane.y)); // required for correct matrix multiplication

    let transformX = invDet * ((dir.y * spriteX) - (dir.x * spriteY));
    let transformY = invDet * ((-plane.y * spriteX) + (plane.x * spriteY)); // this is actually the depth inside the screen, that what Z is in 3D

    let spriteScreenX = ((bufferWidth / 2) * (1 + (transformX / transformY))) | 0;

    // parameters for scaling and moving the sprites
    const uDiv = 2;
    const vDiv = 2;
    const vMove = 8;
    let vMoveScreen = (vMove / transformY) | 0;

    // calculate height of the sprite on screen
    let spriteHeight = (Math.abs(((bufferHeight / transformY) | 0)) / vDiv) | 0; // using "transformY" instead of the real distance prevents fisheye
    // calculate lowest and highest pixel to fill in current stripe
    let drawStartY = (((-spriteHeight / 2) + (bufferHeight / 2)) | 0) + vMoveScreen;
    if (drawStartY < 0) drawStartY = 0;
    let drawEndY = (((spriteHeight / 2) + (bufferHeight / 2)) | 0) + vMoveScreen;
    if (drawEndY >= bufferHeight) drawEndY = bufferHeight - 1;

    // calculate width of the sprite
    let spriteWidth = (Math.abs(((bufferHeight / transformY) | 0)) / uDiv) | 0;
    let drawStartX = ((-spriteWidth / 2) + spriteScreenX) | 0;
    if (drawStartX < 0) drawStartX = 0;
    let drawEndX = ((spriteWidth / 2) + spriteScreenX) | 0;
    if (drawEndX >= bufferWidth) drawEndX = bufferWidth - 1;

    let lightBumpValue = 0.4;
    let shadeFactor = Math.min((((drawEndY - drawStartY) / bufferHeight) + lightBumpValue), 1);

    const color = {
      r: 255 * shadeFactor,
      g: 255 * shadeFactor,
      b: 14 * shadeFactor,
    };

    gl.fillStyle = colorToString(color);

    // loop through every vertical stripe of the sprite on screen
    for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
      let texX = ((((((256 * (stripe - ((-spriteWidth / 2) + spriteScreenX))) * textureSize) / spriteWidth)) | 0) / 256) | 0;

      // the conditions in the if are:
      // 1) it's in front of camera plane so you don't see things behind you
      // 2) it's on the screen (left)
      // 3) it's on the screen (right)
      // 4) ZBuffer, with perpendicular distance
      if (transformY > 0 && stripe > 0 && stripe < bufferWidth && transformY < zBuffer[stripe]) {
        for (let y = drawStartY; y < drawEndY; y++) { // for every pixel of the current stripe
          let d = (((y - vMoveScreen) * 256) - (bufferHeight * 128)) + (spriteHeight * 128); // 256 and 128 factors to avoid floats
          let texY = (((d * textureSize) / spriteHeight) / 256) | 0;

          if (!SPRITE_TEX[texY]) continue;
          if (SPRITE_TEX[texY][texX] === 1) gl.fillRect(stripe, y, 1, 1);
        }
      }
    }
  }

  // Render offscreen buffer
  engine.gl.drawImage(offscreen, 0, 0, 360, 400);

  if (window.DEBUG) {
    const dict = {};
    const pixels = engine.gl.getImageData(0, 0, 360, 400).data;
    for (let i = 0; i < pixels.length; i += 4) {
      const key = colorToString({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
      if (pixels[i + 3] !== 255) throw new Error('Alpha is not 255!');
      dict[key] = true;
    }

    console.log(`Distinct colors in frame: ${Object.keys(dict).length}`);
  }

  // Rendering end
  // Input processing
  const keyState = getKeyState();

  if (keyState.up) {
    const dx = pos.x + (dir.x * playerMoveSpeed);
    const dy = pos.y + (dir.y * playerMoveSpeed);
    if (checkMapCollision(dx, pos.y)) pos.x = dx;
    if (checkMapCollision(pos.x, dy)) pos.y = dy;
  }

  if (keyState.down) {
    const dx = pos.x - (dir.x * playerMoveSpeed);
    const dy = pos.y - (dir.y * playerMoveSpeed);
    if (checkMapCollision(dx, pos.y)) pos.x = dx;
    if (checkMapCollision(pos.x, dy)) pos.y = dy;
  }

  const rotationVector = { x: -1 * dir.y, y: dir.x };

  if (keyState.right) {
    const dx = pos.x - (rotationVector.x * playerMoveSpeed * 0.5);
    const dy = pos.y - (rotationVector.y * playerMoveSpeed * 0.5);
    if (checkMapCollision(dx, pos.y)) pos.x = dx;
    if (checkMapCollision(pos.x, dy)) pos.y = dy;
  }

  if (keyState.left) {
    const dx = pos.x + (rotationVector.x * playerMoveSpeed * 0.5);
    const dy = pos.y + (rotationVector.y * playerMoveSpeed * 0.5);
    if (checkMapCollision(dx, pos.y)) pos.x = dx;
    if (checkMapCollision(pos.x, dy)) pos.y = dy;
  }

  if (keyState.rotateRight) {
    const oldDirX = dir.x;
    dir.x = (dir.x * Math.cos(-playerRotateSpeed)) - (dir.y * Math.sin(-playerRotateSpeed));
    dir.y = (oldDirX * Math.sin(-playerRotateSpeed)) + (dir.y * Math.cos(-playerRotateSpeed));
    const oldPlaneX = plane.x;
    plane.x = (plane.x * Math.cos(-playerRotateSpeed)) - (plane.y * Math.sin(-playerRotateSpeed));
    plane.y = (oldPlaneX * Math.sin(-playerRotateSpeed)) + (plane.y * Math.cos(-playerRotateSpeed));
  }

  if (keyState.rotateLeft) {
    const oldDirX = dir.x;
    dir.x = (dir.x * Math.cos(playerRotateSpeed)) - (dir.y * Math.sin(playerRotateSpeed));
    dir.y = (oldDirX * Math.sin(playerRotateSpeed)) + (dir.y * Math.cos(playerRotateSpeed));
    const oldPlaneX = plane.x;
    plane.x = (plane.x * Math.cos(playerRotateSpeed)) - (plane.y * Math.sin(playerRotateSpeed));
    plane.y = (oldPlaneX * Math.sin(playerRotateSpeed)) + (plane.y * Math.cos(playerRotateSpeed));
  }

  DEBUG_TIME_END('update');
  window.DEBUG = false;
}

export default {
  update,
};
