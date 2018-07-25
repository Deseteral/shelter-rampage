import getKeyState from '../engine/keyboard';

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

function initializeGameData() {
  window.gameData = {
    pos: { x: 22, y: 12 },
    dir: { x: -1, y: 0 },
    plane: { x: 0, y: 0.66 },
  };
}

function update() {
  const screenWidth = engine.renderer.width;
  const screenHeight = engine.renderer.height;
  const moveSpeed = 0.1;
  const rotSpeed = 0.03;
  const { pos, dir, plane } = gameData;

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

    let color;
    switch (MAP[mapX][mapY]) {
      case 1: color = { r: 255, g: 255, b: 255 }; break;
      case 2: color = { r: 255, g: 255, b: 255 }; break;
      case 3: color = { r: 255, g: 255, b: 255 }; break;
      case 4: color = { r: 255, g: 255, b: 255 }; break;
      default: color = { r: 255, g: 255, b: 255 }; break;
    }

    let shadeFactor = (drawEnd - drawStart) / screenHeight;

    shadeFactor /= 0.03125;
    shadeFactor = 1 - (1 / shadeFactor);

    color = {
      r: color.r * shadeFactor,
      g: color.g * shadeFactor,
      b: color.b * shadeFactor,
    };

    const colorToString = c => `rgb(${c.r}, ${c.g}, ${c.b})`;

    const ctx = engine.renderer.getContext('2d');
    ctx.fillStyle = colorToString(color);
    ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
  }

  const keyState = getKeyState();

  if (keyState.up) {
    if (MAP[Math.floor(pos.x + (dir.x * moveSpeed))][Math.floor(pos.y)] === 0) {
      pos.x += dir.x * moveSpeed;
    }

    if (MAP[Math.floor(pos.x)][Math.floor(pos.y + (dir.y * moveSpeed))] === 0) {
      pos.y += dir.y * moveSpeed;
    }
  }

  if (keyState.down) {
    if (MAP[Math.floor(pos.x - (dir.x * moveSpeed))][Math.floor(pos.y)] === 0) {
      pos.x -= dir.x * moveSpeed;
    }

    if (MAP[Math.floor(pos.x)][Math.floor(pos.y - (dir.y * moveSpeed))] === 0) {
      pos.y -= dir.y * moveSpeed;
    }
  }

  if (keyState.right) {
    const oldDirX = parseFloat(dir.x);
    dir.x = (dir.x * Math.cos(-rotSpeed)) - (dir.y * Math.sin(-rotSpeed));
    dir.y = (oldDirX * Math.sin(-rotSpeed)) + (dir.y * Math.cos(-rotSpeed));
    const oldPlaneX = parseFloat(plane.x);
    plane.x = (plane.x * Math.cos(-rotSpeed)) - (plane.y * Math.sin(-rotSpeed));
    plane.y = (oldPlaneX * Math.sin(-rotSpeed)) + (plane.y * Math.cos(-rotSpeed));
  }

  if (keyState.left) {
    const oldDirX = dir.x;
    dir.x = (dir.x * Math.cos(rotSpeed)) - (dir.y * Math.sin(rotSpeed));
    dir.y = (oldDirX * Math.sin(rotSpeed)) + (dir.y * Math.cos(rotSpeed));
    const oldPlaneX = plane.x;
    plane.x = (plane.x * Math.cos(rotSpeed)) - (plane.y * Math.sin(rotSpeed));
    plane.y = (oldPlaneX * Math.sin(rotSpeed)) + (plane.y * Math.cos(rotSpeed));
  }
}

function render() {

}

export default {
  update,
  render,
};

export { initializeGameData };
