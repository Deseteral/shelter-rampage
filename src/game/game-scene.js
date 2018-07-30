import getKeyState from '../engine/keyboard';

const colorToString = c => `rgb(${c.r},${c.g},${c.b})`;

const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 2, 2, 0, 2, 2, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 4, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 4, 0, 0, 0, 0, 5, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 4, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 4, 0, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const texWidth = 8;
const texHeight = 8;
const screenWidth = 90;
const screenHeight = 100;
const moveSpeed = 0.1;
const rotSpeed = 0.03;

const TEX = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const SPRITE_TEX = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [1, 0, 1, 0, 0, 1, 0, 1],
  [1, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
];

const sprites = [
  { x: 14, y: 12 },
];

const zBuffer = []; // for every vertical line
const spriteOrder = [];
const spriteDistance = [];

const offscreen = document.createElement('canvas');
offscreen.width = screenWidth;
offscreen.height = screenHeight;
const gl = offscreen.getContext('2d');

function combSort(order, dist, amount) {
  let gap = amount;
  let swapped = false;
  while (gap > 1 || swapped) {
    // shrink factor 1.3
    gap = (gap * 10) / 13;
    if (gap === 9 || gap === 10) gap = 11;
    if (gap < 1) gap = 1;
    swapped = false;
    for (let i = 0; i < (amount - gap); i++) {
      let j = i + gap;
      if (dist[i] < dist[j]) {
        let di = dist[i];
        let dj = dist[j];
        dist[i] = dj;
        dist[j] = di;

        let oi = order[i];
        let oj = order[j];
        order[i] = oj;
        order[j] = oi;
        swapped = true;
      }
    }
  }
}

function update() {
  const { pos, dir, plane } = gameData;

  gl.fillStyle = 'black';
  gl.fillRect(0, 0, screenWidth, screenHeight);

  for (let x = 0; x < screenWidth; x++) {
    const cameraX = ((2 * x) / screenWidth) - 1;
    const rayDirX = dir.x + (plane.x * cameraX);
    const rayDirY = dir.y + (plane.y * cameraX);

    let mapX = Math.floor(pos.x);
    let mapY = Math.floor(pos.y);

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
    const lineHeight = Math.floor(screenHeight / perpWallDist);

    // calculate lowest and highest pixel to fill in current stripe
    let drawStart = (-lineHeight / 2) + (screenHeight / 2);
    if (drawStart < 0) {
      drawStart = 0;
    }
    let drawEnd = (lineHeight / 2) + (screenHeight / 2);
    if (drawEnd >= screenHeight) {
      drawEnd = screenHeight - 1;
    }

    drawStart = Math.floor(drawStart, 10);
    drawEnd = Math.floor(drawEnd, 10);

    // calculate value of wallX
    let wallX; // where exactly the wall was hit
    if (side === 0) {
      wallX = pos.y + (perpWallDist * rayDirY);
    } else {
      wallX = pos.x + (perpWallDist * rayDirX);
    }
    wallX -= Math.floor(wallX);

    // x coordinate on the texture
    let texX = parseInt(wallX * texWidth, 10);
    if (side === 0 && rayDirX > 0) texX = texWidth - texX - 1;
    if (side === 1 && rayDirY < 0) texX = texWidth - texX - 1;

    // TODO: Prevent walls ever having shadeFactor = 0 (so that they don't disappear)
    let lightScale = (drawEnd - drawStart) / screenHeight; // 0 to 1
    let lightBumpValue = 0.4; // TODO: REFACTOR THIS
    let shadeFactor = Math.min((parseInt(lightScale * 16, 10) / 16) + lightBumpValue, 1);

    for (let y = drawStart; y < drawEnd; y++) {
      let d = ((y * 256) - (screenHeight * 128)) + (lineHeight * 128); // 256 and 128 factors to avoid floats
      let texY = parseInt(((d * texHeight) / lineHeight) / 256, 10);
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

    // sprite casting
    zBuffer[x] = perpWallDist;

    for (let i = 0; i < sprites.length; i++) {
      spriteOrder[i] = i;
      spriteDistance[i] = (((pos.x - sprites[i].x) * (pos.x - sprites[i].x)) + ((pos.y - sprites[i].y) * (pos.y - sprites[i].y)));
    }

    combSort(spriteOrder, spriteDistance, sprites.length);

    for (let i = 0; i < sprites.length; i++) {
      // translate sprite position to relative to camera
      let spriteX = sprites[spriteOrder[i]].x - pos.x;
      let spriteY = sprites[spriteOrder[i]].y - pos.y;

      // transform sprite with the inverse camera matrix
      // [ planeX   dirX ] -1                                       [ dirY      -dirX ]
      // [               ]       =  1/(planeX*dirY-dirX*planeY) *   [                 ]
      // [ planeY   dirY ]                                          [ -planeY  planeX ]

      let invDet = 1.0 / ((plane.x * dir.y) - (dir.x * plane.y)); // required for correct matrix multiplication

      let transformX = invDet * ((dir.y * spriteX) - (dir.x * spriteY));
      let transformY = invDet * ((-plane.y * spriteX) + (plane.x * spriteY)); // this is actually the depth inside the screen, that what Z is in 3D

      let spriteScreenX = Math.floor((screenWidth / 2) * (1 + (transformX / transformY)));

      // calculate height of the sprite on screen
      let spriteHeight = Math.abs(Math.floor(screenHeight / transformY)); // using "transformY" instead of the real distance prevents fisheye
      // calculate lowest and highest pixel to fill in current stripe
      let drawStartY = Math.floor((-spriteHeight / 2) + (screenHeight / 2));
      if (drawStartY < 0) drawStartY = 0;
      let drawEndY = Math.floor((spriteHeight / 2) + (screenHeight / 2));
      if (drawEndY >= screenHeight) drawEndY = screenHeight - 1;

      // calculate width of the sprite
      let spriteWidth = Math.abs(Math.floor(screenHeight / (transformY)));
      let drawStartX = Math.floor((-spriteWidth / 2) + spriteScreenX);
      if (drawStartX < 0) drawStartX = 0;
      let drawEndX = Math.floor((spriteWidth / 2) + spriteScreenX);
      if (drawEndX >= screenWidth) drawEndX = screenWidth - 1;

      // loop through every vertical stripe of the sprite on screen
      for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
        let texX = Math.floor(Math.floor(256 * (stripe - (-spriteWidth / 2 + spriteScreenX)) * texWidth / spriteWidth) / 256);
        // the conditions in the if are:
        // 1) it's in front of camera plane so you don't see things behind you
        // 2) it's on the screen (left)
        // 3) it's on the screen (right)
        // 4) ZBuffer, with perpendicular distance
        if (transformY > 0 && stripe > 0 && stripe < screenWidth && transformY < zBuffer[stripe]) {
          for (let y = drawStartY; y < drawEndY; y++) { // for every pixel of the current stripe
            let d = ((y * 256) - (screenHeight * 128)) + (spriteHeight * 128); // 256 and 128 factors to avoid floats
            let texY = parseInt(((d * texHeight) / spriteHeight) / 256, 10);
            let color = SPRITE_TEX[texY][texX]; // get current color from the texture
            if (color === 1) {
              // buffer[y][stripe] = color; //paint pixel if it isn't black, black is the invisible color
              gl.fillStyle = 'red';
              gl.fillRect(stripe, y, 1, 1);
            }
          }
        }
      }
    }
  }

  engine.gl.drawImage(offscreen, 0, 0, 360, 400);

  // rendering end
  // input begin
  const keyState = getKeyState();

  if (keyState.up) {
    const dx = pos.x + (dir.x * moveSpeed);
    const dy = pos.y + (dir.y * moveSpeed);
    if (MAP[Math.floor(dx)][Math.floor(pos.y)] === 0) {
      pos.x = dx;
    }

    if (MAP[Math.floor(pos.x)][Math.floor(dy)] === 0) {
      pos.y = dy;
    }
  }

  if (keyState.down) {
    const dx = pos.x - (dir.x * moveSpeed);
    const dy = pos.y - (dir.y * moveSpeed);
    if (MAP[Math.floor(dx)][Math.floor(pos.y)] === 0) {
      pos.x = dx;
    }

    if (MAP[Math.floor(pos.x)][Math.floor(dy)] === 0) {
      pos.y = dy;
    }
  }

  const rot = { x: -1 * dir.y, y: dir.x };

  if (keyState.right) {
    const dx = pos.x - (rot.x * moveSpeed * 0.5);
    const dy = pos.y - (rot.y * moveSpeed * 0.5);
    if (MAP[Math.floor(dx)][Math.floor(pos.y)] === 0) {
      pos.x = dx;
    }

    if (MAP[Math.floor(pos.x)][Math.floor(dy)] === 0) {
      pos.y = dy;
    }
  }

  if (keyState.left) {
    const dx = pos.x + (rot.x * moveSpeed * 0.5);
    const dy = pos.y + (rot.y * moveSpeed * 0.5);
    if (MAP[Math.floor(dx)][Math.floor(pos.y)] === 0) {
      pos.x = dx;
    }

    if (MAP[Math.floor(pos.x)][Math.floor(dy)] === 0) {
      pos.y = dy;
    }
  }

  if (keyState.rotateRight) {
    const oldDirX = parseFloat(dir.x);
    dir.x = (dir.x * Math.cos(-rotSpeed)) - (dir.y * Math.sin(-rotSpeed));
    dir.y = (oldDirX * Math.sin(-rotSpeed)) + (dir.y * Math.cos(-rotSpeed));
    const oldPlaneX = parseFloat(plane.x);
    plane.x = (plane.x * Math.cos(-rotSpeed)) - (plane.y * Math.sin(-rotSpeed));
    plane.y = (oldPlaneX * Math.sin(-rotSpeed)) + (plane.y * Math.cos(-rotSpeed));
  }

  if (keyState.rotateLeft) {
    const oldDirX = dir.x;
    dir.x = (dir.x * Math.cos(rotSpeed)) - (dir.y * Math.sin(rotSpeed));
    dir.y = (oldDirX * Math.sin(rotSpeed)) + (dir.y * Math.cos(rotSpeed));
    const oldPlaneX = plane.x;
    plane.x = (plane.x * Math.cos(rotSpeed)) - (plane.y * Math.sin(rotSpeed));
    plane.y = (oldPlaneX * Math.sin(rotSpeed)) + (plane.y * Math.cos(rotSpeed));
  }

  sprites[0].y = 6 + (Math.sin(new Date().getTime() / 2000) * 12);
}

export default {
  update,
};
